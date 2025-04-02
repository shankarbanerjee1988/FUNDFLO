import boto3

sns_client = boto3.client("sns")

def send_sns_notification(topic_arn, subject, message):
    sns_client.publish(TopicArn=topic_arn, Subject=subject, Message=message)