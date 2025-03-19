import boto3
import os

AWS_REGION = os.getenv("AWS_REGION")
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)

def get_table(table_name: str):
    return dynamodb.Table(table_name)
