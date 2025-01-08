import type { Tags } from '@/schema/_common/model';

import type { ScheduleSettingFormType } from '@/common/components/schedule-setting-form/schedule-setting-form';

export interface UserChannelCreateParameters {
    protocol_id: string;
    name: string;
    schedule?: ScheduleSettingFormType;
    tags?: Tags;
    data?: Record<string, any>;
}
