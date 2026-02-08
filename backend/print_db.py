from django.conf import settings
db = settings.DATABASES['default']
print(f"ENGINE: {db.get('ENGINE')}")
print(f"NAME: {db.get('NAME')}")
print(f"HOST: {db.get('HOST')}")
print(f"PORT: {db.get('PORT')}")
