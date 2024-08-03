from diagrams import Diagram, Cluster
from diagrams.onprem.database import MongoDB
from diagrams.onprem.queue import ActiveMQ
from diagrams.onprem.client import User
from diagrams.generic.compute import Rack
from diagrams.aws.engagement import SES
from diagrams.onprem.compute import Server

with Diagram("Subscription Management System", show=False, direction="TB"):
    
    user = User("User")
    
    with Cluster("Microservices"):
        with Cluster("User Service"):
            users_db = MongoDB("Users DB")
            user_reg = Server("User Registration")
            user_profile = Server("User Profile\nManagement")
            user >> user_reg >> users_db
            user_reg >> user_profile

        with Cluster("Payment Service"):
            payments_db = MongoDB("Payments DB")
            payment_processor = Server("Payment Processing")
            payment_gateway = Server("Payment Gateway")
            user_registration_queue = ActiveMQ("Payment User\nRegistration Queue")
            payment_notification_queue = ActiveMQ("Payment Notification\nQueue")
            user_reg >> user_registration_queue >> payment_processor
            payment_processor >> payments_db
            payment_processor >> payment_gateway
            payment_processor >> payment_notification_queue  # Sends calls and reminders

        with Cluster("Notification Service"):
            notification_processor = Server("Notification Processor")
            email_service = SES("Email Service")
            sms_service = Server("SMS Service")
            payment_notification_queue >> notification_processor >> email_service
            notification_processor >> sms_service

        with Cluster("Subscription Service"):
            subscription_db = MongoDB("Subscription DB")
            subscription_manager = Server("Subscription Manager")
            renewal_processor = Server("Renewal Processor")
            subscription_payment_queue = ActiveMQ("Subscription Payment\nQueue")
            subscription_notification_queue = ActiveMQ("Subscription Notification\nQueue")
            subscription_user_reg_queue = ActiveMQ("Subscribed User\nRegistration Queue")  # New queue for user registration
            user_profile >> subscription_manager >> subscription_db
            subscription_manager >> renewal_processor
            renewal_processor >> subscription_payment_queue  # Logic of payment data to queue
            renewal_processor >> subscription_notification_queue  # Sends calls to notification queue
            user_reg >> subscription_user_reg_queue >> subscription_manager  # User registration to Subscription Service

    user >> user_reg
    email_service >> user
    sms_service >> user
    subscription_payment_queue >> payment_processor  # Connect Subscription to Payment Service
    subscription_notification_queue >> notification_processor  # Connect Subscription to Notification Service
