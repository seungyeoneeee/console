<script lang="ts" setup>
import { PPaneLayout } from '@cloudforet/mirinae';

import ServiceDetailTabsOverviewInfoTable
    from '@/services/alert-manager/components/ServiceDetailTabsOverviewInfoTable.vue';
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
                Most Frequently Occurred Alerts
            </p>
        </p-pane-layout>
        <p-pane-layout class="info col-span-2">
            <p class="title-label">
                Webhook
            </p>
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
