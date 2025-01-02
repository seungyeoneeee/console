<script lang="ts" setup>
import {
    computed, onMounted, reactive,
} from 'vue';

import { makeDistinctValueHandler } from '@cloudforet/core-lib/component-util/query-search';
import { getApiQueryWithToolboxOptions } from '@cloudforet/core-lib/component-util/toolbox';
import { ApiQueryHelper } from '@cloudforet/core-lib/space-connector/helper';
import {
    PHeadingLayout, PHeading, PButton, PToolboxTable,
} from '@cloudforet/mirinae';
import type { DataTableFieldType } from '@cloudforet/mirinae/types/data-display/tables/data-table/type';

import { i18n } from '@/translations';

import { useQueryTags } from '@/common/composables/query-tags';

import { calculateTime } from '@/services/iam/composables/refined-table-data';
import {
    USER_GROUP_MODAL_TYPE,
    USER_GROUP_USERS_SEARCH_HANDLERS,
} from '@/services/iam/constants/user-group-constant';
import { useUserGroupPageStore } from '@/services/iam/store/user-group-page-store';
import type { UserListItemType } from '@/services/iam/types/user-type';

interface Props {
  hasReadWriteAccess: boolean;
}

const props = defineProps<Props>();

const userGroupPageStore = useUserGroupPageStore();
const userGroupPageState = userGroupPageStore.state;
const userGroupPageGetters = userGroupPageStore.getters;

const userListApiQueryHelper = new ApiQueryHelper()
    .setPageStart(userGroupPageState.users.pageStart)
    .setPageLimit(userGroupPageState.users.pageLimit)
    .setSort('name', true);
let userListApiQuery = userListApiQueryHelper.data;

const queryTagHelper = useQueryTags({ keyItemSets: USER_GROUP_USERS_SEARCH_HANDLERS });
const { queryTags } = queryTagHelper;

const state = reactive({
    loading: false,
    userItems: computed<UserListItemType[]>(() => {
        if (userGroupPageState.users.list) {
            return userGroupPageState.users.list.map((user) => ({
                user_id: user.user_id,
                name: user.name,
                auth_type: user.auth_type,
                last_accessed_at: user.last_accessed_at,
                timezone: user.timezone,
            }));
        }
        return [];
    }),
    totalCount: computed<number>(() => tableState.refinedItems.length),
});

const tableState = reactive({
    refinedItems: computed(() => {
        const userItems = state.userItems;
        if (userGroupPageGetters.selectedUserGroups && userGroupPageGetters.selectedUserGroups.length > 0
            && userGroupPageGetters.selectedUserGroups[0].users
        ) {
            const filteredItems = userItems.filter((user) => userGroupPageGetters.selectedUserGroups[0].users.includes(user.user_id));

            return filteredItems;
        }
        return [];
    }),
    fields: computed<DataTableFieldType[]>(() => [
        { name: 'user_id', label: 'User ID' },
        { name: 'name', label: 'Name' },
        { name: 'auth_type', label: 'Auth Type' },
        { name: 'last_accessed_at', label: 'Last Activity' },
    ]),
    valueHandlerMap: computed(() => ({
        user_id: makeDistinctValueHandler('identity.WorkspaceUser', 'user_id'),
        name: makeDistinctValueHandler('identity.WorkspaceUser', 'name', 'string', [{ k: 'name', v: '', o: 'not' }]),
        auth_type: makeDistinctValueHandler('identity.WorkspaceUser', 'auth_type'),
        last_accessed_at: makeDistinctValueHandler('identity.WorkspaceUser', 'last_accessed_at', 'datetime'),
    })),
});

const isUserSelected = computed<boolean>(() => userGroupPageState.users.selectedIndices.length > 0);

/* Component */
const handleSelect = async (index) => {
    userGroupPageState.users.selectedIndices = index;
};

const handleAddUser = () => {
    userGroupPageStore.updateModalSettings({
        type: USER_GROUP_MODAL_TYPE.ADD_NEW_USER,
        title: i18n.t('IAM.USER_GROUP.MODAL.ADD_NEW_USER.TITLE'),
        themeColor: 'primary',
    });
};

const handleRemoveUser = () => {
    userGroupPageStore.updateModalSettings({
        type: USER_GROUP_MODAL_TYPE.REMOVE_USER,
        title: i18n.t('IAM.USER_GROUP.MODAL.REMOVE_USER.TITLE'),
        themeColor: 'alert',
    });
};

const handleChange = async (options: any = {}) => {
    userListApiQuery = getApiQueryWithToolboxOptions(userListApiQueryHelper, options) ?? userListApiQuery;
    if (options.queryTags !== undefined) {
        userGroupPageStore.$patch((_state) => {
            _state.state.users.searchFilters = userListApiQueryHelper.filters;
        });
    }

    if (options.pageStart !== undefined) userGroupPageState.users.pageStart = options.pageStart;
    if (options.pageLimit !== undefined) userGroupPageState.users.pageLimit = options.pageLimit;

    try {
        state.loading = true;
        await userGroupPageStore.listUsers({ query: userListApiQuery });
    } finally {
        state.loading = false;
    }
};


onMounted(async () => {
    await userGroupPageStore.listUsers({
        query: userListApiQuery,
    });
});
</script>

<template>
    <div class="user-group-management-users">
        <p-heading-layout class="pt-8 px-4 pb-6">
            <template #heading>
                <p-heading heading-type="sub"
                           use-selected-count
                           use-total-count
                           :total-count="state.totalCount"
                           :title="`${i18n.t('IAM.USER_GROUP.TAB.USERS.TITLE')}`"
                />
            </template>
            <template v-if="props.hasReadWriteAccess"
                      #extra
            >
                <div class="toolbox-wrapper">
                    <div class="toolbox">
                        <p-button style-type="tertiary"
                                  icon-left="ic_plus"
                                  @click="handleAddUser"
                        >
                            {{ $t('IAM.USER_GROUP.TAB.USERS.ADD_USER') }}
                        </p-button>
                        <p-button style-type="tertiary"
                                  :disabled="!isUserSelected"
                                  @click="handleRemoveUser"
                        >
                            {{ $t('IAM.USER_GROUP.TAB.USERS.REMOVE') }}
                        </p-button>
                    </div>
                </div>
            </template>
        </p-heading-layout>
        <p-toolbox-table search-type="query"
                         searchable
                         selectable
                         multi-select
                         sortable
                         sort-desc
                         sort-by="name"
                         :refreshable="false"
                         :fields="tableState.fields"
                         :items="tableState.refinedItems"
                         :select-index="userGroupPageState.users.selectedIndices"
                         :key-item-sets="USER_GROUP_USERS_SEARCH_HANDLERS"
                         :query-tags="queryTags"
                         :value-handler-map="tableState.valueHandlerMap"
                         :loading="state.loading"
                         @select="handleSelect"
                         @change="handleChange"
                         @refresh="handleChange()"
        >
            <template #col-last_accessed_at-format="{value, item}">
                <span v-if="calculateTime(value, item.timezone) === -1">
                    {{ $t('IAM.USER_GROUP.TAB.USERS.TODAY') }}
                </span>
                <span v-else-if="calculateTime(value, item.timezone) === 0">
                    {{ $t('IAM.USER_GROUP.TAB.USERS.YESTERDAY') }}
                </span>
                <span v-else>
                    {{ calculateTime(value, item.timezone) }} {{ $t('IAM.USER_GROUP.TAB.USERS.DAYS') }}
                </span>
            </template>
        </p-toolbox-table>
    </div>
</template>

<style scoped lang="postcss">
.user-group-management-users {
    .toolbox-wrapper {
        .toolbox {
            @apply flex;
            gap: 8px;
        }
    }
}
:deep(.p-toolbox-table) {
    border-width: 0;
}
</style>
