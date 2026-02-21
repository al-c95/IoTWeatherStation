interface NotificationChannel
{
    send(title: string, message: string): Promise<void>;
}

export default NotificationChannel;