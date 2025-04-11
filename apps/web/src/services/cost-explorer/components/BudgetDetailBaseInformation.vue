<script setup lang="ts">
import { computed, reactive } from 'vue';

import dayjs from 'dayjs';


import {
    PCard, PDefinitionTable, PToggleButton, PLink, PButton, PPaneLayout, PTextInput,
} from '@cloudforet/mirinae';

import { useUserWorkspaceStore } from '@/store/app-context/workspace/user-workspace-store';
import { CURRENCY_SYMBOL } from '@/store/display/constant';
import { useServiceAccountReferenceStore } from '@/store/reference/service-account-reference-store';

import ProjectLinkButton from '@/common/modules/project/ProjectLinkButton.vue';
import UserSelectDropdown from '@/common/modules/user/UserSelectDropdown.vue';

import { SERVICE_ACCOUNT_ROUTE } from '@/services/service-account/routes/route-constant';

import { useBudgetDetailPageStore } from '../stores/budget-detail-page-store';
import BudgetAlertsModal from './BudgetAlertsModal.vue';

const budgetPageStore = useBudgetDetailPageStore();
const budgetPageState = budgetPageStore.$state;
const serviceAccountReferenceStore = useServiceAccountReferenceStore();
const userWorkspaceStore = useUserWorkspaceStore();

const getServiceAccountName = (serviceAccountId: string): string|undefined => serviceAccountReferenceStore.getters.serviceAccountItems[serviceAccountId]?.label;

const budgetData = computed(() => budgetPageState.budgetData);

const state = reactive({
    definitionFields: [
        { name: 'cycle', label: 'Budget Cycle' },
        { name: 'totalPeriod', label: 'Total Period' },
        { name: 'budgetScope', label: 'Budget Scope' },
        { name: 'budgetPlan', label: 'Budget Plan' },
        { name: 'budgetManager', label: 'Budget Manager' },
        { name: 'budgetAlerts', label: 'Budget Alerts' },
        { name: 'alertRecipients', label: 'Alert Recipients' },
    ],
    definitionData: computed(() => ({
        cycle: budgetData.value?.time_unit === 'MONTHLY' ? 'Monthly' : 'Fixed Term',
        totalPeriod: `${budgetData.value?.start} ~ ${budgetData.value?.end}`,
        budgetScope: budgetData.value?.service_account_id ?? budgetData.value?.project_id,
        budgetPlan: budgetData.value?.time_unit === 'MONTHLY' ? budgetData.value.planned_limits : budgetData.value?.limit,
        budgetManager: budgetData.value?.budget_manager_id,
        budgetAlerts: budgetData.value?.notification,
        alertRecipients: budgetData.value?.notification.recipients?.users,
    })),
    isBudgetAlertsEnabled: budgetData.value?.notification.state === 'ENABLED' ? true : false as boolean,
    updateBudgetAlertsModalVisible: false,
    budgetAlertEdit: false,
    budgetEdit: false,
    budgetManagerEdit: false,
    alertRecipientsEdit: false,
});

const handleUpdateBudgetAlerts = async (value: boolean) => {
    state.updateBudgetAlertsModalVisible = value;
    await budgetPageStore.getBudgetData(budgetPageState.budgetData?.budget_id ?? '');
};

const updateBudgetData = (updateParams: any) => {
    if (budgetData.value?.budget_id) {
        budgetPageStore.updateBudgetData({
            budgetId: budgetData.value?.budget_id,
            updateParams,
        });
    }
};

const updateBudgetInfo = (type: string) => {
    if (type === 'budgetManager') {
        updateBudgetData({
            budget_manager_id: '',
        });
        state.budgetManagerEdit = false;
    }
};
</script>

<template>
    <div>
        <p-card size="lg"
                :header="$t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.BASE_INFORMATION.TITLE')"
        >
            <p-definition-table class="mb-10"
                                :fields="state.definitionFields"
                                :data="state.definitionData"
                                block
                                disable-copy
                                custom-key-width="160px"
                                style-type="white"
            >
                <template #data-budgetPlan="{ data }">
                    <div class="flex justify-between">
                        <p-pane-layout v-if="budgetPageState.budgetData?.time_unit === 'MONTHLY'"
                                       class="grid grid-cols-4 gap-6 px-4 py-3 min-w-[62rem]"
                        >
                            <div v-for="(dateInfo, idx) in data"
                                 :key="`date-info-${idx}`"
                                 :class="{overflow: data.length > 12}"
                            >
                                <p class="flex flex-col gap-2">
                                    <span class="font-bold text-xs text-gray-600">
                                        {{ dayjs.utc(dateInfo.date).format('MMM YYYY') }}
                                    </span>
                                    <span v-if="!state.budgetEdit">
                                        {{ CURRENCY_SYMBOL[budgetPageState.budgetData?.currency ?? ''] }}
                                        {{ dateInfo.limit }}
                                    </span>
                                    <p-text-input v-else-if="state.budgetEdit"
                                                  :value="dateInfo.limit"
                                    >
                                        <template #input-right>
                                            {{ CURRENCY_SYMBOL[budgetPageState.budgetData?.currency ?? ''] }}
                                        </template>
                                    </p-text-input>
                                </p>
                            </div>
                        </p-pane-layout>
                        <span v-else-if="!state.budgetEdit && budgetPageState.budgetData?.time_unit === 'TOTAL'">
                            {{ CURRENCY_SYMBOL[budgetPageState.budgetData?.currency ?? ''] }}
                            {{ data }}
                        </span>
                        <p-button v-if="!state.budgetEdit"
                                  class="tertiary"
                                  size="sm"
                                  @click="state.budgetEdit = true"
                        >
                            {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.BASE_INFORMATION.EDIT') }}
                        </p-button>
                        <div v-if="state.budgetEdit"
                             class="flex gap-2"
                        >
                            <p-button size="sm"
                                      style-type="transparent"
                                      @click="state.budgetEdit = false"
                            >
                                {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.CANCEL') }}
                            </p-button>
                            <p-button
                                size="sm"
                                @click="state.budgetEdit = false"
                            >
                                {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.SAVE_CHANGES') }}
                            </p-button>
                        </div>
                    </div>
                </template>
                <template #data-budgetScope="{ data }">
                    <div>
                        <div v-if="data.startsWith('project-')">
                            <project-link-button :project-id="data"
                                                 highlight
                            />
                        </div>
                        <div v-else-if="data.startsWith('sa-')">
                            <p-link
                                :text="getServiceAccountName(data)"
                                action-icon="external-link"
                                new-tab
                                :to="{
                                    name: SERVICE_ACCOUNT_ROUTE.DETAIL._NAME,
                                    params: {
                                        workspaceId: userWorkspaceStore.getters.currentWorkspaceId,
                                        serviceAccountId: budgetPageState.budgetData?.service_account_id
                                    }
                                }"
                                highlight
                            />
                        </div>
                    </div>
                </template>
                <template #data-budgetManager="{ data }">
                    <div
                        :class="{isDisplayed: !state.budgetManagerEdit ,isEditing: state.budgetManagerEdit}"
                    >
                        <span v-if="!state.budgetManagerEdit">{{ data }}</span>
                        <user-select-dropdown
                            v-else
                            show-user-list
                            :excluded-selected-ids="data"
                        />
                        <p-button v-if="!state.budgetManagerEdit"
                                  class="tertiary"
                                  size="sm"
                                  @click="state.budgetManagerEdit = true"
                        >
                            {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.BASE_INFORMATION.EDIT') }}
                        </p-button>
                        <div v-else
                             class="flex gap-2"
                        >
                            <p-button size="sm"
                                      style-type="transparent"
                                      @click="state.budgetManagerEdit = false"
                            >
                                {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.CANCEL') }}
                            </p-button>
                            <p-button
                                size="sm"
                                @click="updateBudgetInfo('budgetManager')"
                            >
                                {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.SAVE_CHANGES') }}
                            </p-button>
                        </div>
                    </div>
                </template>
                <template #data-budgetAlerts="{ data }">
                    <div
                        class="flex justify-between"
                    >
                        <div class="flex items-center gap-2">
                            <p-toggle-button :value="!state.isBudgetAlertsEnabled"
                                             show-state-text
                                             position="left"
                                             @change-toggle="() => {
                                                 state.updateBudgetAlertsModalVisible = true;
                                                 state.isBudgetAlertsEnabled = !state.isBudgetAlertsEnabled;
                                             }"
                            />
                            <span>{{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.BASE_INFORMATION.BUDGET_ALERTS_TEXT') }}:</span>
                            <p v-if="!state.budgetAlertEdit">
                                <span v-for="(plan, index) in data.plans"
                                      :key="`plan-${index}`"
                                >
                                    {{ plan.threshold }} {{ plan.unit === 'PERCENT' ? '%' : '' }}
                                </span>
                            </p>
                            <div v-else>
                                <p-text-input appearance-type="stack" />
                            </div>
                        </div>
                        <p-button v-if="!state.budgetAlertEdit"
                                  class="tertiary"
                                  size="sm"
                                  @click="state.budgetAlertEdit = true"
                        >
                            {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.BASE_INFORMATION.EDIT') }}
                        </p-button>
                        <div v-else
                             class="flex gap-2"
                        >
                            <p-button size="sm"
                                      style-type="transparent"
                                      @click="state.budgetAlertEdit = false"
                            >
                                {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.CANCEL') }}
                            </p-button>
                            <p-button
                                size="sm"
                                @click="state.budgetAlertEdit = false"
                            >
                                {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.SAVE_CHANGES') }}
                            </p-button>
                        </div>
                    </div>
                </template>
                <template #data-alertRecipients="{ data }">
                    <div class="flex justify-between">
                        <p>
                            <span v-for="(d ,idx) in data"
                                  :key="`${d}-${idx}`"
                            >
                                {{ d }},
                            </span>
                        </p>
                        <p-button v-if="!state.alertRecipientsEdit"
                                  class="tertiary"
                                  size="sm"
                                  @click="state.alertRecipientsEdit = true"
                        >
                            {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.BASE_INFORMATION.EDIT') }}
                        </p-button>
                        <div v-else
                             class="flex gap-2"
                        >
                            <p-button size="sm"
                                      style-type="transparent"
                                      @click="state.alertRecipientsEdit = false"
                            >
                                {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.CANCEL') }}
                            </p-button>
                            <p-button
                                size="sm"
                                @click="state.alertRecipientsEdit = false"
                            >
                                {{ $t('BILLING.COST_MANAGEMENT.BUDGET.DETAIL.MODAL.SAVE_CHANGES') }}
                            </p-button>
                        </div>
                    </div>
                </template>
            </p-definition-table>
        </p-card>
        <budget-alerts-modal :visible="state.updateBudgetAlertsModalVisible"
                             :budget-on-off-value="state.isBudgetAlertsEnabled"
                             @update:visible="handleUpdateBudgetAlerts"
        />
    </div>
</template>

<style scoped lang="postcss">
.p-pane-layout {
    @apply bg-gray-100;
}

.p-context-menu-item {
    position: absolute;
    z-index: 1000;
}

.p-text-input {
    width: 10rem;
}

.overflow {
    @apply grid grid-rows-2;
}

.isDisplayed {
    @apply flex justify-between items-center;
}

.isEditing {
    @apply flex flex-col justify-between items-end gap-1.5;
}
</style>
