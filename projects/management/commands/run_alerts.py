from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from datetime import date, timedelta
from projects.models import Project, Alert, StageLog, Milestone
class Command(BaseCommand):
    help = 'Generate CapEx deadline and stall alerts. Add to cron: 0 6 * * *'
    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true',
                            help='Print alerts without saving')
    def handle(self, *args, **options):
        dry = options['dry_run']
        today = date.today()
        generated = 0
        active = Project.objects.filter(
            status__in=['on_track','delayed','critical']
        ).select_related('department','district','assigned_je')
        for p in active:
            generated += self._capex(p, today, dry)
            generated += self._stuck(p, today, dry)
            generated += self._no_update(p, today, dry)
        msg = f'[dry-run] ' if dry else ''
        self.stdout.write(f'{msg}Generated {generated} alerts for {today}')
    def _capex(self, p, today, dry):
        if not p.capex_due: return 0
        days = (p.capex_due - today).days
        mapping = {30:'capex_30d', 15:'capex_15d', 7:'capex_7d'}
        created = 0
        for threshold, atype in mapping.items():
            if days == threshold:
                if not dry and not Alert.objects.filter(
                        project=p, alert_type=atype, resolved=False).exists():
                    msg = (f"CapEx booking due in {days} days. "
                           f"₹{p.budget_lakhs}L budget, {p.physical_pct}% physical. "
                           f"Deadline: {p.capex_due}.")
                    Alert.objects.create(project=p, alert_type=atype,
                                         message=msg, days_left=days)
                    self._email(p, msg)
                    created += 1
                elif dry:
                    self.stdout.write(f'  WOULD CREATE: {atype} for {p.project_code}')
                    created += 1
        if days < 0:
            atype = 'capex_od'
            if not dry and not Alert.objects.filter(
                    project=p, alert_type=atype, resolved=False).exists():
                msg = (f"CapEx OVERDUE by {abs(days)} days. "
                       f"Deadline was {p.capex_due}. Immediate action required.")
                Alert.objects.create(project=p, alert_type=atype,
                                     message=msg, days_left=days)
                self._email(p, msg)
                created += 1
        return created
    def _stuck(self, p, today, dry):
        last = StageLog.objects.filter(project=p).order_by('-logged_at').first()
        if not last: return 0
        days = (today - last.stage_date).days
        if days > 30:
            if not dry and not Alert.objects.filter(
                    project=p, alert_type='stage_stuck', resolved=False).exists():
                Alert.objects.create(
                    project=p, alert_type='stage_stuck', days_left=None,
                    message=f"Stuck at '{p.get_current_stage_display()}' "
                            f"for {days} days since {last.stage_date}.")
                return 1
            elif dry:
                self.stdout.write(f'  WOULD CREATE: stage_stuck for {p.project_code} ({days}d)')
                return 1
        return 0
    def _no_update(self, p, today, dry):
        last = Milestone.objects.filter(project=p).order_by('-captured_at').first()
        if not last: return 0
        days = (today - last.captured_at.date()).days
        if days > 14:
            if not dry and not Alert.objects.filter(
                    project=p, alert_type='no_update', resolved=False).exists():
                Alert.objects.create(
                    project=p, alert_type='no_update', days_left=None,
                    message=f"No field update for {days} days. "
                            f"Last update: {last.captured_at.date()}.")
                return 1
            elif dry:
                self.stdout.write(f'  WOULD CREATE: no_update for {p.project_code} ({days}d)')
                return 1
        return 0
    def _email(self, project, message):
        if not project.assigned_je or not project.assigned_je.email: return
        try:
            send_mail(
                subject=f"[DCIS] {project.project_code} — Action Required",
                message=f"{message}\n\nProject: {project.name}\n"
                        f"District: {project.district}\n"
                        f"Log in: https://dcis.cg.gov.in",
                from_email='dcis@cg.gov.in',
                recipient_list=[project.assigned_je.email],
                fail_silently=True,
            )
        except Exception:
            pass
