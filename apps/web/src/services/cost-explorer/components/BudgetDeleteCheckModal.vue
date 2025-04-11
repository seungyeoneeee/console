<script setup lang="ts">
import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { PButtonModal } from '@cloudforet/mirinae';

import type { BudgetDeleteParameters } from '@/api-clients/cost-analysis/budget/schema/api-verbs/delete';
import type { BudgetModel } from '@/api-clients/cost-analysis/budget/schema/model';

import ErrorHandler from '@/common/composables/error/errorHandler';

interface Props {
    visible: boolean;
    selectedIndices: string[]|undefined;
}

const props = withDefaults(defineProps<Props>(), {
    visible: true,
    selectedIndices: undefined,
});

const emit = defineEmits<{(e: 'update:visible', visible: boolean): void
}>();

const handleClose = () => {
    emit('update:visible', false);
};

const handleConfirm = async () => {
    if (props.selectedIndices && props.selectedIndices?.length > 0) {
        await deleteBudgets(props.selectedIndices);
        emit('update:visible', false);
    }
};

const deleteBudgets = async (budgetIds: string[]) => {
    try {
        await Promise.all(budgetIds.map(async (budgetId) => {
            await SpaceConnector.clientV2.costAnalysis.budget.delete<BudgetDeleteParameters, BudgetModel>({
                budget_id: budgetId,
            });
        }));
    } catch (error) {
        ErrorHandler.handleError(error);
    }
};
</script>

<template>
    <p-button-modal :visible="props.visible"
                    size="sm"
                    theme-color="alert"
                    hide-body
                    header-title="Do you really want to delete Budget?"
                    @confirm="handleConfirm"
                    @close="handleClose"
                    @cancel="handleClose"
    />
</template>
