from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, District, Department, Project, StageLog, Milestone, Alert, AuditLog
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('DCIS Role', {'fields': ('role', 'mobile', 'designation', 'department', 'district')}),
    )
    list_display = ['username', 'get_full_name', 'role', 'district', 'department', 'is_active']
    list_filter  = ['role', 'district', 'department', 'is_active']
@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ['name', 'division', 'lwe']
    list_filter  = ['division', 'lwe']
    search_fields = ['name']
@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'budget_cr', 'scheme_primary']
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display  = ['project_code', 'name', 'district', 'department',
                     'scheme', 'status', 'current_stage', 'capex_due',
                     'physical_pct', 'budget_lakhs', 'spent_lakhs']
    list_filter   = ['status', 'current_stage', 'scheme', 'district__division',
                     'department', 'district']
    search_fields = ['name', 'project_code', 'contractor']
    date_hierarchy = 'capex_due'
    readonly_fields = ['created_at', 'last_updated']
@admin.register(StageLog)
class StageLogAdmin(admin.ModelAdmin):
    list_display = ['project', 'stage', 'stage_date', 'updated_by', 'voucher_ref', 'logged_at']
    list_filter  = ['stage']
    search_fields = ['project__project_code', 'project__name']
@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ['project', 'physical_pct', 'issue_flag', 'issue_type',
                    'logged_by', 'captured_at']
    list_filter  = ['issue_flag', 'issue_type']
@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['project', 'alert_type', 'days_left', 'resolved', 'triggered_at']
    list_filter  = ['alert_type', 'resolved']
    actions      = ['mark_resolved']
    def mark_resolved(self, request, queryset):
        from django.utils import timezone
        queryset.update(resolved=True, resolved_by=request.user, resolved_at=timezone.now())
    mark_resolved.short_description = "Mark selected alerts as resolved"
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'user', 'project', 'ip_address', 'logged_at']
    list_filter  = ['action']
    search_fields = ['user__username', 'project__project_code']
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
