from django.core.management.base import BaseCommand
from projects.models import District, Department, Project, User
from datetime import date
class Command(BaseCommand):
    help = 'Seed Chhattisgarh districts, departments, sample projects and demo users'
    def handle(self, *args, **options):
        self.create_districts()
        self.create_departments()
        self.create_projects()
        self.create_users()
        self.stdout.write(self.style.SUCCESS('Seed complete'))
    def create_districts(self):
        data = [
            # Bastar division — 7 districts, 4 LWE
            ('Bastar','bastar',False), ('Bijapur','bastar',True),
            ('Dantewada','bastar',True), ('Kanker','bastar',False),
            ('Kondagaon','bastar',False), ('Narayanpur','bastar',True),
            ('Sukma','bastar',True),
            # Bilaspur division — 8 districts
            ('Bilaspur','bilaspur',False), ('Raigarh','bilaspur',False),
            ('Janjgir-Champa','bilaspur',False), ('Korba','bilaspur',False),
            ('Mungeli','bilaspur',False), ('Sakti','bilaspur',False),
            ('Sarangarh-Bilaigarh','bilaspur',False),
            ('Gorela-Pendra-Marwahi','bilaspur',False),
            # Durg division — 7 districts
            ('Durg','durg',False), ('Rajnandgaon','durg',False),
            ('Balod','durg',False), ('Bemetara','durg',False),
            ('Kabirdham','durg',False),
            ('Khairagarh-Chhuikhadan-Gandai','durg',False),
            ('Manpur-Mohla','durg',False),
            # Raipur division — 5 districts
            ('Raipur','raipur',False), ('Balodabazar','raipur',False),
            ('Gariaband','raipur',False), ('Mahasamund','raipur',False),
            ('Dhamtari','raipur',False),
            # Surguja division — 6 districts
            ('Surguja','surguja',False), ('Jashpur','surguja',False),
            ('Korea','surguja',False), ('Surajpur','surguja',False),
            ('Balrampur','surguja',False), ('Manendragarh','surguja',False),
        ]
        for name, div, lwe in data:
            District.objects.get_or_create(name=name, defaults={'division':div,'lwe':lwe})
        self.stdout.write(f'  Districts: {District.objects.count()}')
    def create_departments(self):
        data = [
            ('PWD',  'Public Works & Roads',          3800, 'PMGSY'),
            ('PHE',  'Public Health Eng (JJM)',        2840, 'JJM'),
            ('HLT',  'Health & Family Welfare (NHM)',  1580, 'NHM'),
            ('EDU',  'School Education',               2200, 'SAMAGRA'),
            ('RRL',  'Panchayat & Rural Dev',          1950, 'PMGSY'),
            ('URB',  'Urban Administration (AMRUT)',    800, 'AMRUT'),
        ]
        for code, name, budget, scheme in data:
            Department.objects.get_or_create(
                code=code, defaults={'name':name,'budget_cr':budget,'scheme_primary':scheme}
            )
        self.stdout.write(f'  Departments: {Department.objects.count()}')
    def create_projects(self):
        dhamtari  = District.objects.get(name='Dhamtari')
        raipur    = District.objects.get(name='Raipur')
        bastar    = District.objects.get(name='Bastar')
        kondagaon = District.objects.get(name='Kondagaon')
        bilaspur  = District.objects.get(name='Bilaspur')
        korba     = District.objects.get(name='Korba')
        sukma     = District.objects.get(name='Sukma')
        surguja   = District.objects.get(name='Surguja')
        raigarh   = District.objects.get(name='Raigarh')
        hlt = Department.objects.get(code='HLT')
        phe = Department.objects.get(code='PHE')
        rrl = Department.objects.get(code='RRL')
        urb = Department.objects.get(code='URB')
        edu = Department.objects.get(code='EDU')
        projects = [
            dict(project_code='CG-001', name='PHC Construction – Abhanpur Block',
                 department=hlt, district=raipur, scheme='NHM',
                 budget_lakhs=52, released_lakhs=14, spent_lakhs=3,
                 current_stage='admin', status='critical', physical_pct=0,
                 capex_due=date(2025,3,31), contractor='Not yet awarded'),
            dict(project_code='CG-002', name='Rural Roads – PMGSY Tranche IV Batch 1',
                 department=rrl, district=bastar, scheme='PMGSY',
                 budget_lakhs=280, released_lakhs=224, spent_lakhs=196,
                 current_stage='execution', status='on_track', physical_pct=72,
                 capex_due=date(2025,2,28), contractor='M/s Aryan Infrastructure'),
            dict(project_code='CG-003', name='Har Ghar Nal – Dhamtari Rural Cluster',
                 department=phe, district=dhamtari, scheme='JJM',
                 budget_lakhs=148, released_lakhs=148, spent_lakhs=133,
                 current_stage='uc', status='complete', physical_pct=100,
                 capex_due=date(2024,12,31), contractor='M/s Sai Construction'),
            dict(project_code='CG-004', name='15th FC Road & Drainage – Kondagaon GP',
                 department=rrl, district=kondagaon, scheme='15FC',
                 budget_lakhs=24, released_lakhs=8, spent_lakhs=0,
                 current_stage='dpr', status='critical', physical_pct=0,
                 capex_due=date(2025,3,31), contractor='Not yet awarded'),
            dict(project_code='CG-005', name='AMRUT 2.0 – Sewerage Network Bilaspur',
                 department=urb, district=bilaspur, scheme='AMRUT',
                 budget_lakhs=340, released_lakhs=136, spent_lakhs=0,
                 current_stage='tender', status='delayed', physical_pct=0,
                 capex_due=date(2025,3,31), contractor='Tender in process'),
            dict(project_code='CG-006', name='District Hospital Upgrade – Jagdalpur',
                 department=hlt, district=bastar, scheme='NHM',
                 budget_lakhs=380, released_lakhs=285, spent_lakhs=214,
                 current_stage='milestone', status='on_track', physical_pct=68,
                 capex_due=date(2025,1,31), contractor='M/s Simplex Infra'),
            dict(project_code='CG-007', name='Hasdeo Irrigation – Left Canal Extension',
                 department=phe, district=korba, scheme='PMKSY',
                 budget_lakhs=520, released_lakhs=208, spent_lakhs=182,
                 current_stage='execution', status='critical', physical_pct=29,
                 capex_due=date(2025,3,31), contractor='M/s MEIL'),
            dict(project_code='CG-008', name='PM Gram Sadak – Sukma Remote Habitations',
                 department=rrl, district=sukma, scheme='PMGSY',
                 budget_lakhs=195, released_lakhs=78, spent_lakhs=58,
                 current_stage='execution', status='critical', physical_pct=24,
                 capex_due=date(2025,1,15), contractor='M/s Sahu Roads'),
            dict(project_code='CG-009', name='School Construction – 84 Units Samagra',
                 department=edu, district=surguja, scheme='SAMAGRA',
                 budget_lakhs=186, released_lakhs=168, spent_lakhs=158,
                 current_stage='milestone', status='on_track', physical_pct=88,
                 capex_due=date(2025,2,15), contractor='Multiple agencies'),
            dict(project_code='CG-010', name='Water Treatment Plant – Raigarh Municipal',
                 department=phe, district=raigarh, scheme='JJM',
                 budget_lakhs=224, released_lakhs=112, spent_lakhs=89,
                 current_stage='execution', status='delayed', physical_pct=38,
                 capex_due=date(2025,2,28), contractor='M/s Voltas Water'),
        ]
        for p in projects:
            Project.objects.get_or_create(project_code=p['project_code'], defaults=p)
        self.stdout.write(f'  Projects: {Project.objects.count()}')
    def create_users(self):
        users = [
            dict(username='fin_secretary', password='demo123',
                 first_name='Finance', last_name='Secretary',
                 email='fin@dcis.cg.gov.in', role='finance_secretary'),
            dict(username='collector_dhamtari', password='demo123',
                 first_name='District', last_name='Collector',
                 email='collector.dhamtari@dcis.cg.gov.in',
                 role='collector', district_name='Dhamtari'),
            dict(username='je_sukma', password='demo123',
                 first_name='Junior', last_name='Engineer',
                 email='je.sukma@dcis.cg.gov.in',
                 role='je', district_name='Sukma', dept_code='RRL'),
            dict(username='ddo_raipur', password='demo123',
                 first_name='DDO', last_name='Raipur',
                 email='ddo.raipur@dcis.cg.gov.in',
                 role='ddo', district_name='Raipur', dept_code='HLT'),
        ]
        for u in users:
            district_name = u.pop('district_name', None)
            dept_code     = u.pop('dept_code', None)
            password      = u.pop('password')
            user, created = User.objects.get_or_create(
                username=u['username'], defaults=u
            )
            if created:
                user.set_password(password)
                if district_name:
                    user.district = District.objects.filter(name=district_name).first()
                if dept_code:
                    user.department = Department.objects.filter(code=dept_code).first()
                user.save()
        self.stdout.write(f'  Demo users created')
