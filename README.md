### Design Overview
![subscription_management_system](https://github.com/user-attachments/assets/229d51d2-54a5-4e6a-b3f4-98954b21f758)

### System Design Definition

**System Overview**:  
A subscription management platform enabling users to extend EMI payment dates by paying a minimal charge. The platform is built using a microservices architecture that facilitates independent operation, resilience, and scalability.

**Microservices**:

```plaintext
1. User Service
   - Endpoint: /register
   - Database: users
   - RabbitMQ: Publishes to subscription_user_registration_queue and payment_user_registration_queue

   - Endpoint: /login, /profile
   - Database: users

2. Payment Service
   - Database: payment.users, payments
   - RabbitMQ:
     - Consumes user details from payment_user_registration_queue
     - Consumes payment details from subcription_queue
     - Publishes to notification_queue

3. Notification Service
   - RabbitMQ: Consumes from notification_queue
   - External: Email Service

4. Subscription Service
   - Endpoint: 
     - Create a subscription: POST /
     - Extend subscription due date: POST /:subscriptionId/extend
     - Get extension charges: POST /:subscriptionId/extensionCharges
     - Retrieve payment history for a subscription: GET /user/paymentHistory/:userId
     - Get all subscriptions for a user: GET /user/:userId
     - Update subscription status: PUT /:subscriptionId
     - Cancel a subscription: DELETE /:subscriptionId/cancel
   - RabbitMQ:
     - Publishes to payment_queue
     - Publishes to notification_queue
     - Consumes from payment_user_registration_queue

5. RabbitMQ
   - Queue: subscription_user_registration_queue
   - Queue: payment_user_registration_queue
   - Queue: payment_queue
   - Queue: notification_queue
   - Queue: update_payment_queue

6. Databases
   - User Service Database: users
   - Payment Service Database: payment.users, payments
   - Subcription Service Database: subscriptions, subscription.users, subscription.payments
   - Notification Service Database: notifications
```

**Data Flow Diagram**:
![image](https://github.com/user-attachments/assets/fa1602b6-54e0-4c64-8679-2c8d91e72890)


### Data Flow

1. **User Registration**:
    - The user registers via the `User Service`.
    - The `User Service` creates a user entry in the `users` database within its own microservice.
    - The `User Service` then publishes user data to two separate queues: `subscription_user_registration_queue` and `payment_user_registration_queue`.
    - The `Subscription Service` and `Payment Service` consume these messages to create entries in their respective `subscriptionusers` and `paymentusers` collections.

2. **Subscription Management**:
    - The user creates a subscription via the `Subscription Service`.
    - The `Subscription Service` handles the subscription creation based on the provided subscription type (e.g., one-time, 3-month, 6-month, 12-month).
    - It schedules payments by publishing messages to the `payment_queue`, which are then consumed by the `Payment Service`.
    - If the user chooses to extend a payment, the `Subscription Service` finds the nearest payment due date and publishes a message to the `update_payment_queue` to extend the payment date.
    - The `Subscription Service` also publishes relevant data to the `notification_queue` to inform the user of subscription creation or payment extensions.

3. **Payment Processing**:
    - The `Payment Service` consumes messages from the `payment_queue` (for scheduled payments) and `update_payment_queue` (for extended payments).
    - The `Payment Service` retrieves user details from the `paymentusers` collection.
    - On the scheduled payment day, the `Payment Service` processes the payment using stored card details through the Stripe payment gateway.
    - Payment details, whether successful or failed, are stored in the `payments` collection.
    - Upon processing a payment (whether successful or failed), the `Payment Service` publishes a notification to the `notification_queue`.

4. **Notification Dispatch**:
    - The `Notification Service` consumes messages from the `notification_queue`.
    - It sends out emails to users through an external email service regarding their payment status, subscription creation, or reminders.
    - The service also manages reminders for failed payments, sending notifications every 2 hours, and sending minimum balance alerts one day prior to the payment date.


This documentation outlines a streamlined flow, ensuring each service is designed to operate independently while communicating effectively through designated RabbitMQ queues. This architecture promotes robustness, scalability, and responsiveness within the subscription management platform.

Created by - Abhishek Kumar
