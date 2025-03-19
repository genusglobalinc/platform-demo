import boto3
import os

client = boto3.client("cognito-idp", region_name="us-east-1")

USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")

def signup_user(username, password, email):
    response = client.sign_up(
        ClientId=CLIENT_ID,
        Username=username,
        Password=password,
        UserAttributes=[{"Name": "email", "Value": email}]
    )
    return response

def login_user(username, password):
    response = client.initiate_auth(
        ClientId=CLIENT_ID,
        AuthFlow="USER_PASSWORD_AUTH",
        AuthParameters={"USERNAME": username, "PASSWORD": password}
    )
    return response["AuthenticationResult"]["IdToken"]
