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
            user_profile = Server("User Profile Management")
            user >> user_reg >> users_db
            user_reg >> user_profile

        with Cluster("Payment Service"):
            payments_db = MongoDB("Payments DB")
            payment_processor = Server("Payment Processing")
            payment_gateway = Server("Payment Gateway")
            user_registration_queue = ActiveMQ("User Registration Queue")
            payment_notification_queue = ActiveMQ("Payment Notification Queue")
            user_reg >> user_registration_queue >> payment_processor
            payment_processor >> payments_db
            payment_processor >> payment_gateway
            payment_processor >> payment_notification_queue

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
            user_profile >> subscription_manager >> subscription_db
            subscription_manager >> renewal_processor

        with Cluster("Reporting Service"):
            reporting_db = MongoDB("Reporting DB")
            analytics_processor = Server("Analytics Processor")
            subscription_db >> analytics_processor >> reporting_db
            payments_db >> analytics_processor

    user >> user_reg
    email_service >> user
    sms_service >> user
    analytics_processor >> Rack("BI Tools")
