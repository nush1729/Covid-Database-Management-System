# backend/app/schemas/user_schema.py

from app import ma
from app.models.user import User

class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        exclude = ("password",)  # never return password in API output

user_schema = UserSchema()
users_schema = UserSchema(many=True)
