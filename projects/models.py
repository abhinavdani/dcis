from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
ROLES = [
    ("finance_secretary", "Finance Secretary"),
    ("collector",         "District Collector"),
    ("dept_head",         "Department Head"),
    ("dpo",               "District Programme Officer"),
    ("ee",                "Executive Engineer"),
    ("ddo",               "Drawing & Disbursing Officer"),
    ("je",                "Junior Engineer"),
]
class User(AbstractUser):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role        = models.CharField(max_length=30, choices=ROLES, default='je')
    mobile      = models.CharField(max_length=15, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    department  = models.ForeignKey("Department", null=True, blank=True,
                                    on_delete=models.SET_NULL, related_name="officers")
    district    = models.ForeignKey("District", null=True, blank=True,
                                    on_delete=models.SET_NULL, related_name="officers")
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"
DIVISIONS = [
    ("bastar",   "Bastar"),
    ("bilaspur", "Bilaspur"),
    ("durg",     "Durg"),
    ("raipur",   "Raipur"),
    ("surguja",  "Surguja"),
]
class District(models.Model):
    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name     = models.CharField(max_length=80)
    division = models.CharField(max_length=20, choices=DIVISIONS)
    lwe      = models.BooleanField(default=False)
    def __str__(self): return self.name
    class Meta: ordering = ["name"]
class Department(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code           = models.CharField(max_length=10, unique=True)
    name           = models.CharField(max_length=100)
    budget_cr      = models.IntegerField(default=0)
    scheme_primary = models.CharField(max_length=50, blank=True)
    def __str__(self): return f"{self.code} — {self.name}"
SCHEMES = [
    ("NHM","National Health Mission"), ("PMGSY","PM Gram Sadak Yojana"),
    ("JJM","Jal Jeevan Mission"), ("PMKSY","PM Krishi Sinchai Yojana"),
    ("AMRUT","AMRUT 2.0"), ("15FC","15th Finance Commission"),
    ("SAMAGRA","Samagra Shiksha"), ("STATE","State Scheme"), ("OTHER","Other"),
]
STAGES = [
    ("need","Need Identified"), ("dpr","DPR Prepared"), ("admin","Admin Approval"),
    ("tender","Tender Issued"), ("wo","Work Order"), ("execution","Execution"),
    ("milestone","50% Milestone"), ("capex","CapEx Booked"), ("uc","Completion & UC"),
]
STATUSES = [
    ("on_track","On Track"), ("delayed","Delayed"),
    ("critical","Critical"),  ("complete","Complete"),
]
FUNDING_MODELS = [
    ("100_centre","100% Centre"), ("90_10","90:10 Centre:State"),
    ("60_40","60:40 Centre:State"), ("50_50","50:50 Centre:State"),
    ("100_state","100% State"),
]
class Project(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_code  = models.CharField(max_length=20, unique=True)
    name          = models.CharField(max_length=255)
    department    = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="projects")
    district      = models.ForeignKey(District, on_delete=models.PROTECT, related_name="projects")
    scheme        = models.CharField(max_length=20, choices=SCHEMES)
    funding_model = models.CharField(max_length=20, choices=FUNDING_MODELS, default="60_40")
    budget_lakhs  = models.IntegerField(default=0)
    released_lakhs= models.IntegerField(default=0)
    spent_lakhs   = models.IntegerField(default=0)
    current_stage = models.CharField(max_length=20, choices=STAGES, default="need")
    status        = models.CharField(max_length=20, choices=STATUSES, default="on_track")
    physical_pct  = models.IntegerField(default=0)
    capex_due     = models.DateField(null=True, blank=True)
    contractor    = models.CharField(max_length=200, blank=True, default="Not yet awarded")
    work_order_ref= models.CharField(max_length=100, blank=True)
    assigned_je   = models.ForeignKey(User, null=True, blank=True,
                                      on_delete=models.SET_NULL, related_name="projects")
    created_at    = models.DateTimeField(auto_now_add=True)
    last_updated  = models.DateTimeField(auto_now=True)
    def __str__(self): return f"{self.project_code} — {self.name}"
    class Meta: ordering = ["capex_due", "status"]
    @property
    def days_to_capex(self):
        from datetime import date
        if not self.capex_due: return None
        return (self.capex_due - date.today()).days
    @property
    def absorption_pct(self):
        if not self.budget_lakhs: return 0
        return round((self.spent_lakhs / self.budget_lakhs) * 100)
class StageLog(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project      = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="stage_logs")
    updated_by   = models.ForeignKey(User, on_delete=models.PROTECT, related_name="stage_updates")
    stage        = models.CharField(max_length=20, choices=STAGES)
    stage_date   = models.DateField()
    done_by_name = models.CharField(max_length=100, blank=True)
    remarks      = models.TextField(blank=True)
    voucher_ref  = models.CharField(max_length=100, blank=True)
    logged_at    = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"{self.project.project_code} — {self.stage}"
    class Meta: ordering = ["logged_at"]
class Milestone(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project      = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="milestones")
    logged_by    = models.ForeignKey(User, on_delete=models.PROTECT, related_name="milestones")
    physical_pct = models.IntegerField()
    remark       = models.TextField(blank=True)
    photo        = models.ImageField(upload_to="milestones/%Y/%m/", blank=True, null=True)
    latitude     = models.FloatField(null=True, blank=True)
    longitude    = models.FloatField(null=True, blank=True)
    issue_flag   = models.BooleanField(default=False)
    issue_type   = models.CharField(max_length=50, blank=True,
                                    choices=[("contractor","Contractor"),
                                             ("material","Material"),
                                             ("land","Land Acquisition"),
                                             ("fund","Fund Release"),
                                             ("security","Security/LWE"),
                                             ("other","Other")])
    captured_at  = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"{self.project.project_code} — {self.physical_pct}%"
    class Meta: ordering = ["-captured_at"]
ALERT_TYPES = [
    ("capex_30d","CapEx due in 30 days"), ("capex_15d","CapEx due in 15 days"),
    ("capex_7d","CapEx due in 7 days"),   ("capex_od","CapEx overdue"),
    ("stage_stuck","Stage stuck >30 days"), ("no_update","No update in 14 days"),
]
class Alert(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project      = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="alerts")
    alert_type   = models.CharField(max_length=20, choices=ALERT_TYPES)
    message      = models.TextField()
    days_left    = models.IntegerField(null=True, blank=True)
    resolved     = models.BooleanField(default=False)
    resolved_by  = models.ForeignKey(User, null=True, blank=True,
                                     on_delete=models.SET_NULL, related_name="resolved_alerts")
    triggered_at = models.DateTimeField(auto_now_add=True)
    resolved_at  = models.DateTimeField(null=True, blank=True)
    def __str__(self): return f"{self.alert_type} — {self.project.project_code}"
    class Meta: ordering = ["-triggered_at"]
class AuditLog(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(User, on_delete=models.PROTECT, related_name="audit_trail")
    project    = models.ForeignKey(Project, null=True, on_delete=models.SET_NULL,
                                   related_name="audit_trail")
    action     = models.CharField(max_length=100)
    old_value  = models.JSONField(null=True, blank=True)
    new_value  = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    logged_at  = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"{self.action} by {self.user} at {self.logged_at}"
    class Meta:
        ordering = ["-logged_at"]
        default_permissions = ("view",)
