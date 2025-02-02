<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router/composables';

import { flatMapDeep, uniq } from 'lodash';

import {
    PEmpty, PSearch, PFieldTitle, PButton,
} from '@cloudforet/mirinae';
import type { TreeNode } from '@cloudforet/mirinae/src/data-display/tree/tree-view/type';
import type { BoardSet } from '@cloudforet/mirinae/types/data-display/board/type';

import type { DashboardModel } from '@/schema/dashboard/_types/dashboard-type';
import type { FolderModel } from '@/schema/dashboard/_types/folder-type';
import { ROLE_TYPE } from '@/schema/identity/role/constant';
import type { DashboardTemplateModel } from '@/schema/repository/dashboard-template/model';
import { store } from '@/store';
import { i18n } from '@/translations';

import { useAppContextStore } from '@/store/app-context/app-context-store';

import { useProperRouteLocation } from '@/common/composables/proper-route-location';

import DashboardCreateBlankBoardItem from '@/services/dashboards/components/dashboard-create/DashboardCreateBlankBoardItem.vue';
import type { FilterLabelItem } from '@/services/dashboards/components/dashboard-create/DashboardCreateStep1SearchFilter.vue';
import DashboardCreateStep1SearchFilter from '@/services/dashboards/components/dashboard-create/DashboardCreateStep1SearchFilter.vue';
import DashboardFolderTree from '@/services/dashboards/components/dashboard-folder/DashboardFolderTree.vue';
import { getDashboardTreeData } from '@/services/dashboards/helpers/dashboard-tree-data-helper';
import { DASHBOARDS_ROUTE } from '@/services/dashboards/routes/route-constant';
import { useDashboardCreatePageStore } from '@/services/dashboards/stores/dashboard-create-page-store';
import { useDashboardPageControlStore } from '@/services/dashboards/stores/dashboard-page-control-store';
import type { DashboardTreeDataType } from '@/services/dashboards/types/dashboard-folder-type';



const emit = defineEmits<{(e: 'click-next'): void }>();
const router = useRouter();
const { getProperRouteLocation } = useProperRouteLocation();
const appContextStore = useAppContextStore();
const dashboardCreatePageStore = useDashboardCreatePageStore();
const dashboardCreatePageState = dashboardCreatePageStore.state;
const dashboardCreatePageGetters = dashboardCreatePageStore.getters;
const dashboardPageControlStore = useDashboardPageControlStore();
const dashboardPageControlGetters = dashboardPageControlStore.getters;
const storeState = reactive({
    isAdminMode: computed(() => appContextStore.getters.isAdminMode),
    isWorkspaceMember: computed(() => store.getters['user/getCurrentRoleInfo']?.roleType === ROLE_TYPE.WORKSPACE_MEMBER),
});
const state = reactive({
    templates: [] as DashboardTemplateModel[],
    blankTemplate: computed<BoardSet[]>(() => ([{
        template_id: 'blank',
        name: 'Blank',
    }])),
    ootbTemplateTreeData: computed<TreeNode<DashboardTreeDataType>[]>(() => {
        const results: TreeNode<DashboardTreeDataType>[] = [];
        const _filteredTemplates = getFilteredTemplates(dashboardCreatePageState.dashboardTemplates, filterState.inputValue, filterState.selectedLabels, filterState.selectedProviders);
        _filteredTemplates.forEach((d) => {
            results.push({
                id: d.template_id,
                depth: 0,
                data: {
                    name: d.name,
                    id: d.template_id,
                    type: 'DASHBOARD',
                    labels: d.labels,
                },
            });
        });
        return results;
    }),
    existingDashboardTreeData: computed<TreeNode<DashboardTreeDataType>[]>(() => {
        let _allFolderItems: FolderModel[] = dashboardPageControlGetters.allFolderItems;
        let _allDashboardItems: DashboardModel[] = dashboardPageControlGetters.allDashboardItems;
        if (storeState.isWorkspaceMember) {
            _allFolderItems = dashboardPageControlGetters.privateFolderItems;
            _allDashboardItems = dashboardPageControlGetters.privateDashboardItems;
        }
        const _filteredDashboardItems: DashboardModel[] = getFilteredTemplates(_allDashboardItems, filterState.inputValue, filterState.selectedLabels, filterState.selectedProviders);
        return getDashboardTreeData(_allFolderItems, _filteredDashboardItems).filter((d) => {
            if (d.data.type === 'FOLDER') return !!d.children?.length;
            return true;
        });
    }),
    allExistingLabels: computed<string[]>(() => {
        const _ootbTemplates = getFilteredTemplates(dashboardCreatePageState.dashboardTemplates, '', [], []);
        const _existingTemplates = getFilteredTemplates(dashboardPageControlGetters.allDashboardItems, '', [], []);

        const _ootbLabels = flatMapDeep(_ootbTemplates.map((d) => d.labels ?? []));
        const _existingLabels = flatMapDeep(_existingTemplates.map((d) => d.labels ?? []));
        return uniq([..._ootbLabels, ..._existingLabels]);
    }),
});

const filterState = reactive({
    inputValue: '',
    selectedLabels: [] as string[],
    selectedProviders: [] as string[],
    selectedStartOption: 'templates',
});

/* Util */
const getFilteredTemplates = (
    dashboards: Array<DashboardModel|DashboardTemplateModel>,
    inputValue: string,
    selectedLabels: FilterLabelItem[],
    selectedProviders: FilterLabelItem[],
): Array<DashboardModel|DashboardTemplateModel> => {
    const _inputValue = inputValue.toLowerCase();
    const _selectedLabels = selectedLabels;
    const _selectedProviders = selectedProviders;
    return dashboards
        .filter((d) => (!_selectedLabels.length || d.labels?.some((label) => _selectedLabels.includes(label.toLowerCase()))))
        .filter((d) => (!_selectedProviders.length || d.labels?.some((label) => _selectedProviders.includes(label.toLowerCase()))))
        .filter((d) => (_inputValue === '' || d.name?.toLowerCase().includes(_inputValue.toLowerCase())));
};

/* Event */
const handleSelectLabels = (labels: FilterLabelItem[]) => {
    filterState.selectedLabels = labels.map((d) => d.name.toLowerCase());
};
const handleSelectProvider = (providers: FilterLabelItem[]) => {
    filterState.selectedProviders = providers.map((d) => d.label.toLowerCase());
};
const handleSelectStartOption = (startOption: string) => {
    filterState.selectedStartOption = startOption;
    dashboardCreatePageStore.setSelectedOotbIdMap({});
    dashboardCreatePageStore.setSelectedExistingDashboardIdMap({});
};
const handleClickCancel = () => {
    router.push(getProperRouteLocation({ name: DASHBOARDS_ROUTE._NAME }));
};

onMounted(() => {
    dashboardCreatePageStore.listDashboardTemplates();
});
</script>

<template>
    <div class="dashboard-create-step-1">
        <div class="contents-container">
            <dashboard-create-step1-search-filter :labels="state.allExistingLabels"
                                                  @select-label="handleSelectLabels"
                                                  @select-provider="handleSelectProvider"
                                                  @select-start-option="handleSelectStartOption"
            />
            <div class="template-contents-area">
                <p-search :value.sync="filterState.inputValue"
                          class="search-wrapper"
                />
                <template v-if="filterState.selectedStartOption === 'templates'">
                    <dashboard-create-blank-board-item :template-sets="state.blankTemplate"
                                                       class="blank-board"
                    />
                    <p-field-title :label="i18n.t('DASHBOARDS.CREATE.OOTB_DASHBOARD')"
                                   class="field-title"
                                   required
                    />
                    <dashboard-folder-tree :selected-id-map="dashboardCreatePageState.selectedOotbIdMap"
                                           :dashboard-tree-data="state.ootbTemplateTreeData"
                                           readonly-mode
                                           disable-link
                                           @update:selectedIdMap="dashboardCreatePageStore.setSelectedOotbIdMap"
                    />
                </template>
                <dashboard-folder-tree v-else
                                       :selected-id-map="dashboardCreatePageState.selectedExistingDashboardIdMap"
                                       :dashboard-tree-data="state.existingDashboardTreeData"
                                       readonly-mode
                                       @update:selectedIdMap="dashboardCreatePageStore.setSelectedExistingDashboardIdMap"
                />
                <p-empty v-if="!state.ootbTemplateTreeData.length && !state.existingDashboardTreeData.length"
                         show-image
                         class="empty-template"
                >
                    <template #image>
                        <img alt="empty-image"
                             class="empty-image"
                             src="@/assets/images/img_ghost.png"
                        >
                    </template>
                    No Data
                </p-empty>
                <div class="step-button-wrapper">
                    <p-button style-type="transparent"
                              @click="handleClickCancel"
                    >
                        {{ $t('DASHBOARDS.CREATE.CANCEL') }}
                    </p-button>
                    <p-button icon-right="ic_arrow-right"
                              style-type="substitutive"
                              :disabled="dashboardCreatePageGetters.noBundleSelected"
                              @click="emit('click-next')"
                    >
                        {{ $t('DASHBOARDS.CREATE.NEXT') }}
                    </p-button>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="postcss" scoped>
.dashboard-create-step-1 {
    @apply flex flex-col h-full;
    width: 100%;
    overflow: visible;
    .contents-container {
        @apply flex gap-4;
        margin-top: 1.5rem;

        @screen tablet {
            @apply flex-col;
        }

        .template-contents-area {
            flex-grow: 1;

            .search-wrapper {
                margin-bottom: 1.5rem;
            }
            .blank-board {
                padding-bottom: 2rem;
            }
            .field-title {
                margin-bottom: 0.5rem;
            }
            .empty-template {
                padding-top: 3rem;
                .empty-image {
                    width: 5rem;
                    height: 5rem;
                }
            }
            .step-button-wrapper {
                display: flex;
                gap: 1rem;
                margin-top: 2rem;
                justify-content: end;
            }
        }
    }
}
</style>
