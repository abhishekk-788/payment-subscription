from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.database import MongoDB
from diagrams.onprem.queue import ActiveMQ
from diagrams.onprem.client import User
from diagrams.generic.compute import Rack
from diagrams.aws.engagement import SES
from diagrams.onprem.compute import Server
from diagrams.onprem.container import Docker
from diagrams.k8s.compute import Pod
from diagrams.k8s.clusterconfig import HPA
from diagrams.onprem.monitoring import Grafana
from diagrams.onprem.inmemory import Redis

with Diagram("Subscription Management System", show=False, direction="TB"):
    
    user = User("User")
    
    with Cluster("Microservices"):
        with Cluster("User Service"):
            users_db = MongoDB("Users DB")
            user_reg = Server("User Registration\nUser Login")
            user_profile = Server("User Profile\nManagement")
            forgot_password = Server("Forgot Password")  # Single server for forgot password logic
            user_auth = Redis("User Auth\nTokens")  # Redis for authentication tokens
            otp_store = Redis("OTP Store")  # Redis for storing OTPs
            notification_queue = ActiveMQ("Notification Queue")  # Queue for sending notifications

            # Forgot Password Flow
            user >> forgot_password >> otp_store  # Store OTP in Redis
            forgot_password >> notification_queue  # Send OTP request to Notification Queue
            
            user >> user_reg >> users_db
            user_reg >> user_profile
            user_reg >> notification_queue  # Send user registration notification to Notification Queue
            user_reg >> user_auth  # Storing auth tokens in Redis
            
        with Cluster("Payment Service"):
            payments_db = MongoDB("Payments DB")
            payment_processor = Server("Payment Processing")
            payment_gateway = Server("Payment Gateway")
            user_registration_queue = ActiveMQ("Payment User\nQueue")
            payment_notification_queue = ActiveMQ("Notification Queue")
            user_reg >> user_registration_queue >> payment_processor
            payment_processor >> payments_db
            payment_processor >> payment_gateway
            payment_processor >> payment_notification_queue  # Sends calls and reminders
            payment_extension = Server("Payment Extension\nProcessing")  # New feature for extending EMI options
            payment_processor >> payment_extension
            payment_processor >> user_auth  # Authenticate using tokens in Redis

        with Cluster("Notification Service"):
            notification_processor = Server("Notification Processor")
            email_service = SES("Email Service")
            notification_queue >> notification_processor >> email_service  # Process notifications through queue

        with Cluster("Subscription Service"):
            subscription_db = MongoDB("Subscription DB")
            subscription_manager = Server("Subscription Manager")
            renewal_processor = Server("Renewal Processor")
            subscription_payment_queue = ActiveMQ("Subscription Payment\nQueue")
            subscription_notification_queue = ActiveMQ("Notification Queue")
            subscription_user_reg_queue = ActiveMQ("Subscription User\nQueue")  # New queue for user registration
            user_profile >> subscription_manager >> subscription_db
            subscription_manager >> subscription_db  # Save info to Subscription DB
            subscription_manager >> subscription_payment_queue  # Send data to Subscription Payment Queue
            renewal_processor >> subscription_db  # Save info to Subscription DB
            renewal_processor >> subscription_payment_queue  # Logic of payment data to queue
            renewal_processor >> subscription_notification_queue  # Sends calls to notification queue
            subscription_manager >> user_auth  # Authenticate using tokens in Redis
            user_reg >> subscription_user_reg_queue >> subscription_manager  # User registration to Subscription Service

    with Cluster("Infrastructure"):
        docker = Docker("Docker")
        kubernetes = Pod("Kubernetes")
        k6 = Server("k6 Testing")
        grafana = Grafana("Grafana Logs")
        
        user_reg - Edge(style="dashed") - docker
        payment_processor - Edge(style="dashed") - docker
        notification_processor - Edge(style="dashed") - docker
        subscription_manager - Edge(style="dashed") - docker
        
        docker >> kubernetes
        kubernetes >> HPA("Horizontal Pod Autoscaler")
        
        k6 >> Edge(label="Load Test Results") >> grafana
        kubernetes >> Edge(label="Metrics") >> grafana

    user >> user_reg
    subscription_payment_queue >> payment_processor  # Connect Subscription to Payment Service
    subscription_notification_queue >> notification_processor  # Connect Subscription to Notification Service
