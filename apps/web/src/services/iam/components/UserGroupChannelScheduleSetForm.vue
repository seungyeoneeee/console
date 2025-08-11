<script lang="ts" setup>
import {
    computed, watchEffect,
} from 'vue';

import { useUserGroupChannelApi } from '@/api-clients/alert-manager/user-group-channel/composables/use-user-group-channel-api';
import { useServiceQueryKey } from '@/query/core/query-key/use-service-query-key';
import { useScopedQuery } from '@/query/service-query/use-scoped-query';

import type { ScheduleSettingFormType } from '@/common/components/schedule-setting-form/schedule-setting-form';
import ScheduleSettingForm from '@/common/components/schedule-setting-form/ScheduleSettingForm.vue';

import { useNotificationChannelCreateFormStore } from '@/services/iam/store/notification-channel-create-form-store';
import { useUserGroupPageStore } from '@/services/iam/store/user-group-page-store';


const userGroupPageStore = useUserGroupPageStore();
const userGroupPageGetters = userGroupPageStore.getters;

const notificationChannelCreateFormStore = useNotificationChannelCreateFormStore();
const notificationChannelCreateFormState = notificationChannelCreateFormStore.state;

const channelId = computed(() => userGroupPageGetters.selectedUserGroupChannel?.[0]?.channel_id ?? '');

const { userGroupChannelAPI } = useUserGroupChannelApi();

const { key: userGroupChannelGetQueryKey, params: userGroupChannelGetQueryParams } = useServiceQueryKey('alert-manager', 'user-group-channel', 'get', {
    params: computed(() => ({
        channel_id: channelId.value,
    })),
});

const { data: userGroupChannelData } = useScopedQuery({
    queryKey: userGroupChannelGetQueryKey,
    queryFn: () => userGroupChannelAPI.get(userGroupChannelGetQueryParams.value),
    enabled: computed(() => !!channelId.value),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 2,
}, ['DOMAIN', 'WORKSPACE']);

/* Component */
const handleScheduleForm = (value: ScheduleSettingFormType) => {
    notificationChannelCreateFormStore.updateSchedule(value);
};

watchEffect(() => {
    if (userGroupChannelData.value?.schedule) {
        notificationChannelCreateFormStore.updateSchedule(userGroupChannelData.value.schedule);
    }
});
</script>

<template>
    <div class="flex flex-col bg-white border border-primary-3 rounded-md py-8 px-4">
        <p class="text-2xl mb-4">
            {{ $t('IAM.USER_GROUP.MODAL.CREATE_CHANNEL.DESC.SCHEDULE.TITLE') }}
        </p>
        <schedule-setting-form
            :key="channelId"
            :schedule-form="notificationChannelCreateFormState.scheduleInfo"
            @update-form="handleScheduleForm"
        />
    </div>
</template>
