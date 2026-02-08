from users.models import User
try:
    u = User.objects.filter(email='info@fruitfulvineheritageschools.org.ng').first()
    if u:
        print(f"User found: {u.username}")
        print(f"Email: {u.email}")
        print(f"Active: {u.is_active}")
        print(f"Role: {u.role}")
        print(f"School: {u.school.domain if u.school else 'None'}")
    else:
        print("User NOT found")
except Exception as e:
    print(f"Error: {e}")
