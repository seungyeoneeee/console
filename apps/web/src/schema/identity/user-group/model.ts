import type { Tags } from '@/schema/_common/model';

export interface UserGroupModel {
    user_group_id: string;
    name: string;
    description?: string;
    users: string[];
    notification_channels: string[];
    tags: Tags;
    workspace_id: string;
    domain_id: string;
    created_at: string;
}

export interface NotificationChannelPerUserGroupModel {
    channel_id: string;
    name: string;
    state: string;
    data: [];
    schedule: [];
    tags: [];
    secret_id: string;
    protocol_id: string;
    user_group_id: string;
    workspace_id: string;
    domain_id: string;
    created_at: string;
}
