from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db.models import Sum, Count, Q
from datetime import date, timedelta
from .models import (Project, Department, District, StageLog,
                     Milestone, Alert, AuditLog, User)
from .serializers import (ProjectListSerializer, ProjectDetailSerializer,
                           AlertSerializer, DepartmentSerializer, DistrictSerializer)
def scoped_projects(user):
    qs = Project.objects.select_related('department', 'district')
    if user.role == 'finance_secretary':
        return qs
    if user.role in ('collector', 'dept_head', 'dpo', 'ee', 'ddo'):
        if user.district:
            return qs.filter(district=user.district)
    if user.role == 'je':
        filters = Q(assigned_je=user)
        if user.district:
            filters |= Q(district=user.district, department=user.department)
        return qs.filter(filters)
    return qs
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': {
            'id': str(user.id),
            'username': user.username,
            'full_name': user.get_full_name(),
            'role': user.role,
            'district': user.district.name if user.district else None,
            'department': user.department.code if user.department else None,
        }
    })
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def overview(request):
    projects = scoped_projects(request.user)
    today = date.today()
    dept_stats = []
    for dept in Department.objects.all():
        dept_projects = projects.filter(department=dept)
        dept_stats.append({
            'code': dept.code,
            'name': dept.name,
            'budget_cr': dept.budget_cr,
            'spent_lakhs': dept_projects.aggregate(t=Sum('spent_lakhs'))['t'] or 0,
            'released_lakhs': dept_projects.aggregate(t=Sum('released_lakhs'))['t'] or 0,
            'total_projects': dept_projects.count(),
            'critical': dept_projects.filter(status='critical').count(),
            'on_track': dept_projects.filter(status='on_track').count(),
        })
    return Response({
        'total_budget_cr':    Department.objects.aggregate(t=Sum('budget_cr'))['t'] or 0,
        'total_spent_lakhs':  projects.aggregate(t=Sum('spent_lakhs'))['t'] or 0,
        'total_released_lakhs': projects.aggregate(t=Sum('released_lakhs'))['t'] or 0,
        'total_projects':     projects.count(),
        'critical_count':     projects.filter(status='critical').count(),
        'capex_overdue':      projects.filter(
                                capex_due__lt=today,
                                status__in=['on_track','delayed','critical']).count(),
        'capex_due_30d':      projects.filter(
                                capex_due__range=[today, today + timedelta(days=30)],
                                status__in=['on_track','delayed','critical']).count(),
        'by_status': {s: projects.filter(status=s).count()
                      for s in ['on_track','delayed','critical','complete']},
        'by_department': dept_stats,
    })
class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names  = ['get', 'post', 'patch', 'head', 'options']
    def get_queryset(self):
        qs = scoped_projects(self.request.user)
        p  = self.request.query_params
        if p.get('dept'):     qs = qs.filter(department__code=p['dept'])
        if p.get('district'): qs = qs.filter(district__name__icontains=p['district'])
        if p.get('status'):   qs = qs.filter(status=p['status'])
        if p.get('scheme'):   qs = qs.filter(scheme=p['scheme'])
        if p.get('stage'):    qs = qs.filter(current_stage=p['stage'])
        if p.get('q'):
            qs = qs.filter(Q(name__icontains=p['q']) |
                           Q(project_code__icontains=p['q']) |
                           Q(district__name__icontains=p['q']))
        return qs.order_by('capex_due', '-status')
    def get_serializer_class(self):
        return ProjectDetailSerializer if self.action == 'retrieve' else ProjectListSerializer
    @action(detail=True, methods=['post'], url_path='stage-update')
    def stage_update(self, request, pk=None):
        project = self.get_object()
        stage   = request.data.get('stage')
        if not stage:
            return Response({'error': 'stage is required'}, status=400)
        log = StageLog.objects.create(
            project      = project,
            updated_by   = request.user,
            stage        = stage,
            stage_date   = request.data.get('stage_date', date.today()),
            done_by_name = request.data.get('done_by_name', ''),
            remarks      = request.data.get('remarks', ''),
            voucher_ref  = request.data.get('voucher_ref', ''),
        )
        old_stage = project.current_stage
        project.current_stage = stage
        if stage == 'uc':
            project.status = 'complete'
        project.save()
        AuditLog.objects.create(
            user=request.user, project=project,
            action='stage_updated',
            old_value={'stage': old_stage},
            new_value={'stage': stage, 'remarks': request.data.get('remarks','')},
            ip_address=request.META.get('REMOTE_ADDR'),
        )
        return Response({'status': 'updated', 'new_stage': stage, 'log_id': str(log.id)})
    @action(detail=True, methods=['post'], url_path='milestone')
    def add_milestone(self, request, pk=None):
        project = self.get_object()
        m = Milestone.objects.create(
            project      = project,
            logged_by    = request.user,
            physical_pct = int(request.data.get('physical_pct', project.physical_pct)),
            remark       = request.data.get('remark', ''),
            photo        = request.FILES.get('photo'),
            latitude     = request.data.get('latitude') or None,
            longitude    = request.data.get('longitude') or None,
            issue_flag   = request.data.get('issue_flag', False),
            issue_type   = request.data.get('issue_type', ''),
        )
        project.physical_pct = m.physical_pct
        project.save()
        AuditLog.objects.create(
            user=request.user, project=project,
            action='milestone_added',
            new_value={'physical_pct': m.physical_pct, 'issue_flag': m.issue_flag},
            ip_address=request.META.get('REMOTE_ADDR'),
        )
        return Response({'status': 'recorded', 'id': str(m.id),
                         'physical_pct': m.physical_pct})
    @action(detail=True, methods=['patch'], url_path='financials')
    def update_financials(self, request, pk=None):
        project = self.get_object()
        allowed = ['released_lakhs', 'spent_lakhs', 'status', 'contractor', 'work_order_ref']
        old = {f: getattr(project, f) for f in allowed}
        for field in allowed:
            if field in request.data:
                setattr(project, field, request.data[field])
        project.save()
        AuditLog.objects.create(
            user=request.user, project=project,
            action='financials_updated',
            old_value=old,
            new_value={f: request.data[f] for f in allowed if f in request.data},
            ip_address=request.META.get('REMOTE_ADDR'),
        )
        return Response({'status': 'updated'})
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alerts_list(request):
    projects = scoped_projects(request.user)
    alerts   = Alert.objects.filter(
        project__in=projects, resolved=False
    ).select_related('project__district', 'project__department').order_by('-triggered_at')[:100]
    return Response(AlertSerializer(alerts, many=True).data)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health(request):
    from django.db import connection
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception:
        db_ok = False
    return Response({'status': 'ok', 'db': 'connected' if db_ok else 'error'})
