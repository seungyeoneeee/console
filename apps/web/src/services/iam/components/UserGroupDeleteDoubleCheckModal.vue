<script lang="ts" setup>
import {
    computed, onMounted, reactive, watchEffect,
} from 'vue';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { PTableCheckModal } from '@cloudforet/mirinae';


import type { UserGroupDeleteUserGroupParameters } from '@/schema/identity/user-group/api-verbs/delete';
import type { UserGroupModel } from '@/schema/identity/user-group/model';
import { i18n } from '@/translations';

import { useAllReferenceStore } from '@/store/reference/all-reference-store';

import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { USER_GROUP_MODAL_TYPE } from '@/services/iam/constants/user-group-constant';
import { useUserGroupPageStore } from '@/services/iam/store/user-group-page-store';

const emit = defineEmits<{(e: 'confirm'): void; }>();

const userGroupPageStore = useUserGroupPageStore();
const userGroupPageState = userGroupPageStore.state;
const userGroupPageGetters = userGroupPageStore.getters;

const allReferenceStore = useAllReferenceStore();
const allReferenceGetters = allReferenceStore.getters;

const storeState = reactive({
    selectedUserGroupIds: computed(() => userGroupPageGetters.selectedUserGroups.map((userGroup) => userGroup.user_group_id)),
    selectedUserGroupNames: computed(() => userGroupPageGetters.selectedUserGroups.map((userGroup) => userGroup.name)),
    referenceServices: computed(() => allReferenceGetters.service),
});

const state = reactive({
    loading: false,
    filteredServices: [] as Record<string, any>,
});

const tableState = reactive({
    fields: [
        { name: 'service', label: 'Service' },
        { name: 'description', label: 'Description' },
    ],
    items: computed<{service: string; description: string}[]>(() => state.filteredServices.map((service) => ({
        service: service.name,
        description: service.description,
    }))),
});

/* Component */
const handleConfirm = async () => {
    const deletePromises = storeState.selectedUserGroupIds.map((userGroupId) => fetchDeleteUserGroup({
        user_group_id: userGroupId,
    }));
    try {
        state.loading = true;
        await Promise.all(deletePromises);
        emit('confirm');
        showSuccessMessage(i18n.t('IAM.USER_GROUP.MODAL.DELETE.SHOW_SUCCESS_MESSAGE'), '');
    } finally {
        state.loading = false;
        handleCancel();
    }
};

const handleCancel = () => {
    state.loading = false;
    userGroupPageState.modal = {
        type: '',
        title: '',
        themeColor: 'primary',
    };
};

/* API */
const fetchDeleteUserGroup = async (params: UserGroupDeleteUserGroupParameters) => {
    try {
        await SpaceConnector.clientV2.identity.userGroup.delete<UserGroupDeleteUserGroupParameters, UserGroupModel>(params);
    } catch (e) {
        ErrorHandler.handleError(e);
    }
};

const fetchServiceList = async () => {
    //     state.filteredServices = filteredResults.filter((d) => d.members.USER_GROUP.includes(storeState.selectedUserGroupIds[0]));
    // const { results } = await SpaceConnector.clientV2.alertManager.service.list<ServiceListParameters, ListResponse<ServiceModel>>();

};

watchEffect(() => {
    Object.values(storeState.referenceServices).forEach((service: any) => {
        if (service.data && service.data.members !== undefined && service.data.members.USER_GROUP.length > 0) {
            console.log(service.data.members.USER_GROUP, storeState.selectedUserGroupIds);
        }
        // if (service && Object.keys(service).includes('data') && service.data.members.USER_GROUP && service.data.members.USER_GROUP.includes(storeState.selectedUserGroupIds[0])) {
        //     return {
        //         service: service.name,
        //         description: service.data.description,
        //     };
        // }
        // return {};
    });
});

/* Mounted */
onMounted(async () => {
    await fetchServiceList();
});
</script>

<template>
    <p-table-check-modal size="sm"
                         :header-title="userGroupPageState.modal.title"
                         :loading="state.loading"
                         :visible="userGroupPageState.modal.type === USER_GROUP_MODAL_TYPE.DELETE"
                         :theme-color="userGroupPageState.modal.themeColor"
                         :fields="tableState.fields"
                         :items="tableState.items"
                         @confirm="handleConfirm"
                         @cancel="handleCancel"
    />
</template>
