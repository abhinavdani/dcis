from rest_framework import serializers
from .models import Project, Department, District, StageLog, Milestone, Alert, User
class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'name', 'division', 'lwe']
class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'code', 'name', 'budget_cr', 'scheme_primary']
class StageLogSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    class Meta:
        model = StageLog
        fields = ['id', 'stage', 'stage_date', 'done_by_name', 'remarks',
                  'voucher_ref', 'logged_at', 'updated_by_name']
class MilestoneSerializer(serializers.ModelSerializer):
    logged_by_name = serializers.CharField(source='logged_by.get_full_name', read_only=True)
    photo_url = serializers.SerializerMethodField()
    class Meta:
        model = Milestone
        fields = ['id', 'physical_pct', 'remark', 'photo_url', 'latitude',
                  'longitude', 'issue_flag', 'issue_type', 'captured_at', 'logged_by_name']
    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
        return None
class ProjectListSerializer(serializers.ModelSerializer):
    department_code = serializers.CharField(source='department.code', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    district_name   = serializers.CharField(source='district.name', read_only=True)
    division        = serializers.CharField(source='district.division', read_only=True)
    days_to_capex   = serializers.ReadOnlyField()
    absorption_pct  = serializers.ReadOnlyField()
    class Meta:
        model = Project
        fields = ['id', 'project_code', 'name', 'department_code', 'department_name',
                  'district_name', 'division', 'scheme', 'funding_model', 'budget_lakhs',
                  'released_lakhs', 'spent_lakhs', 'current_stage', 'status',
                  'physical_pct', 'capex_due', 'days_to_capex', 'absorption_pct',
                  'contractor', 'last_updated']
class ProjectDetailSerializer(ProjectListSerializer):
    stage_logs = StageLogSerializer(many=True, read_only=True)
    milestones = serializers.SerializerMethodField()
    open_alerts = serializers.SerializerMethodField()
    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + [
            'work_order_ref', 'created_at', 'stage_logs', 'milestones', 'open_alerts'
        ]
    def get_milestones(self, obj):
        qs = obj.milestones.all()[:5]
        return MilestoneSerializer(qs, many=True, context=self.context).data
    def get_open_alerts(self, obj):
        return list(obj.alerts.filter(resolved=False).values(
            'id', 'alert_type', 'message', 'days_left', 'triggered_at'
        ))
class AlertSerializer(serializers.ModelSerializer):
    project_code = serializers.CharField(source='project.project_code', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_id   = serializers.UUIDField(source='project.id', read_only=True)
    district     = serializers.CharField(source='project.district.name', read_only=True)
    dept         = serializers.CharField(source='project.department.code', read_only=True)
    class Meta:
        model = Alert
        fields = ['id', 'project_code', 'project_name', 'project_id', 'district', 'dept',
                  'alert_type', 'message', 'days_left', 'resolved', 'triggered_at']
