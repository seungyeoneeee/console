<script lang="ts" setup>
import type { ComputedRef } from 'vue';
import {
    watch, computed, reactive,
} from 'vue';
import { useRoute } from 'vue-router/composables';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { PDataTable } from '@cloudforet/mirinae';

import type { ListResponse } from '@/schema/_common/api-verbs/list';
import type { AlertListParameters } from '@/schema/alert-manager/alert/api-verbs/list';
import type { AlertModel } from '@/schema/alert-manager/alert/model';

import ErrorHandler from '@/common/composables/error/errorHandler';

interface AlertInfoState {
  alertList: AlertModel[]
  serviceId: ComputedRef<string>;
}

const route = useRoute();

const state = reactive<AlertInfoState>({
    alertList: [],
    serviceId: computed(() => route.params?.serviceId),
});

const tableState = reactive({
    fields: [
        {
            name: 'occurred_cnt', label: '', width: '10%', display: false,
        },
        {
            name: 'title', label: 'Title', width: '60%',
        },
        {
            name: 'triggered_by', label: 'Triggered by', width: '30%',
        },
    ],
    items: computed<{ title: string; triggered_by: string; }[]>(() => state.alertList.map((alert) => ({
        occurred_cnt: 0,
        title: alert.title,
        triggered_by: alert.triggered_by,
    }))),
});

/* API */
const fetchAlertList = async (params: AlertListParameters) => {
    try {
        const { results } = await SpaceConnector.clientV2.alertManager.alert.list<AlertListParameters, ListResponse<AlertModel>>(params);
        state.alertList = results || [];
    } catch (e) {
        ErrorHandler.handleError(e, true);
    }
};

watch(() => state.serviceId, async (serviceId) => {
    await fetchAlertList({
        query: {
            filter: [
                { k: 'service_id', v: serviceId, o: 'eq' },
            ],
        },
    });
}, { immediate: true });
</script>

<template>
    <div>
        <p-data-table table-style-type="simple"
                      :fields="tableState.fields"
                      :items="tableState.items"
                      striped
                      :bordered="false"
                      class="table"
        />
    </div>
</template>

<style scoped lang="postcss">
.table {
    min-height: 24.625rem;
}
</style>
