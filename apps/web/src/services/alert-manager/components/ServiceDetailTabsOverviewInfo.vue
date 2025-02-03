<script lang="ts" setup>
import { PPaneLayout } from '@cloudforet/mirinae';

import ServiceDetailTabsOverviewInfoAlertChart
    from '@/services/alert-manager/components/ServiceDetailTabsOverviewInfoAlertChart.vue';
import ServiceDetailTabsOverviewInfoTable
    from '@/services/alert-manager/components/ServiceDetailTabsOverviewInfoTable.vue';
import ServiceDetailTabsOverviewWebhook from '@/services/alert-manager/components/ServiceDetailTabsOverviewWebhook.vue';
</script>

<template>
    <div class="service-detail-tabs-overview-info">
        <p-pane-layout class="info col-span-1">
            <p class="title-label">
                Most Frequently Occurred Alerts
            </p>
            <service-detail-tabs-overview-info-table />
        </p-pane-layout>
        <p-pane-layout class="info col-span-1">
            <p class="title-label">
                Labels with the Most Alerts
            </p>
            <service-detail-tabs-overview-info-alert-chart />
        </p-pane-layout>
        <p-pane-layout class="info col-span-2">
            <p class="title-label">
                Webhook
            </p>
            <!--            TODO: bar graph-->
            <service-detail-tabs-overview-webhook />
        </p-pane-layout>
    </div>
</template>

<style scoped lang="postcss">
.service-detail-tabs-overview-info {
    @apply mt-4 grid grid-flow-row-dense grid-cols-2 grid-rows-2 gap-4;
    .info {
        @apply px-4 py-5;
        .title-label {
            @apply text-[1rem] font-bold mb-5;
        }
    }
}
</style>
