from schools.models import SubscriptionPlan, School
print('--- PLANS ---')
for p in SubscriptionPlan.objects.all():
    print(f'Plan: {p.name} ({p.slug}), Modules: {p.allowed_modules}')

print('\n--- SCHOOLS ---')
for s in School.objects.all():
    try:
        sub = s.subscription
        print(f'School: {s.name}, Plan: {sub.plan.name}, Status: {sub.status}, Modules: {sub.plan.allowed_modules}')
    except:
        print(f'School: {s.name}, No Subscription')
