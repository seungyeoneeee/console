<script lang="ts" setup>
import { computed, reactive } from 'vue';
import type { TranslateResult } from 'vue-i18n';
import { useRouter } from 'vue-router/composables';

import {
    PI, PIconButton, PTreeItem, PLabel, PPopover,
} from '@cloudforet/mirinae';
import type { TreeNode } from '@cloudforet/mirinae/src/data-display/tree/tree-view/type';
import type { QueryTag } from '@cloudforet/mirinae/types/inputs/search/query-search-tags/type';

import { i18n } from '@/translations';

import { useAppContextStore } from '@/store/app-context/app-context-store';

import NewMark from '@/common/components/marks/NewMark.vue';
import { useProperRouteLocation } from '@/common/composables/proper-route-location';
import FavoriteButton from '@/common/modules/favorites/favorite-button/FavoriteButton.vue';
import { FAVORITE_TYPE } from '@/common/modules/favorites/favorite-button/type';

import { gray, indigo, violet } from '@/styles/colors';

import { DASHBOARDS_ROUTE } from '@/services/dashboards/routes/route-constant';
import { useDashboardPageControlStore } from '@/services/dashboards/stores/dashboard-page-control-store';
import type { DashboardTreeDataType } from '@/services/dashboards/types/dashboard-folder-type';


interface Props {
    treeData: TreeNode<DashboardTreeDataType>;
    // for dashboard create page
    disableLink?: boolean;
    readonlyMode?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
});
const emit = defineEmits<{(e: 'toggle-folder'): void;
}>();
const LABELS_LIMIT = 2;
const router = useRouter();
const { getProperRouteLocation } = useProperRouteLocation();
const appContextStore = useAppContextStore();
const dashboardPageControlStore = useDashboardPageControlStore();
const dashboardPageControlState = dashboardPageControlStore.state;
const state = reactive({
    isAdminMode: computed(() => appContextStore.getters.isAdminMode),
    folderControlButtons: computed(() => {
        if (props.readonlyMode) return [];
        const _defaultButtons = [{
            name: 'edit',
            icon: 'ic_edit-text',
            clickEvent: handleEditFolderName,
        }];
        if (props.treeData.data.id.startsWith('private')) {
            return _defaultButtons;
        }
        return [
            ..._defaultButtons,
            {
                name: 'share',
                icon: 'ic_share',
                clickEvent: handleShareFolder,
            },
        ];
    }),
    slicedLabels: computed(() => props.treeData.data?.labels?.slice(0, LABELS_LIMIT) || []),
    showMoreLabels: computed(() => {
        if (!props.treeData?.data?.labels) return false;
        return props.treeData.data.labels.length > LABELS_LIMIT;
    }),
});

/* Util */
const getSharedColor = (node: TreeNode<DashboardTreeDataType>): string|undefined => {
    if (node.data.shared) {
        if (node.data.projectId === '*') return violet[500];
        return indigo[500];
    }
    return undefined;
};
const getSharedText = (node: TreeNode<DashboardTreeDataType>): TranslateResult|undefined => {
    if (node.data.shared) {
        if (state.isAdminMode) {
            if (node.data.projectId === '*') return i18n.t('DASHBOARDS.DETAIL.SHARED_TO_ALL_PROJECTS');
            return i18n.t('DASHBOARDS.DETAIL.SHARED_TO_WORKSPACES');
        }
        if (node.data.projectId === '*') return i18n.t('DASHBOARDS.DETAIL.SHARED_TO_ALL_PROJECTS');
        return i18n.t('DASHBOARDS.DETAIL.SHARED_BY_ADMIN');
    }
    return undefined;
};

/* Event */
const handleClickTreeItem = (): void => {
    if (props.treeData.data.type === 'FOLDER') {
        emit('toggle-folder');
        return;
    }
    if (props.disableLink) return;
    const _location = getProperRouteLocation({
        name: DASHBOARDS_ROUTE.DETAIL._NAME,
        params: {
            dashboardId: props.treeData.data.id || '',
        },
    });
    const _target = props.readonlyMode ? '_blank' : '_self';
    if (_target === '_blank') {
        window.open(router.resolve(_location).href, _target);
        return;
    }
    router.push(_location);
};
const handleEditFolderName = () => {
    dashboardPageControlStore.setFolderFormModalType('UPDATE');
    dashboardPageControlStore.setSelectedFolderId(props.treeData.data.id);
    dashboardPageControlStore.setFolderFormModalVisible(true);
};
const handleShareFolder = () => {
    dashboardPageControlStore.setSelectedFolderId(props.treeData.data.id);
    dashboardPageControlStore.setFolderShareModalVisible(true);
};
const handleClickLabel = (label: string) => {
    dashboardPageControlStore.setSearchQueryTags([
        ...dashboardPageControlState.searchQueryTags,
        {
            key: { name: 'labels', label: 'Label' },
            value: { name: label, label },
            operator: '=',
        } as QueryTag,
    ]);
};
</script>

<template>
    <p-tree-item :node="props.treeData"
                 class="dashboard-folder-tree-item"
    >
        <template #content="{ node }">
            <div class="dashboard-folder-tree-item-content"
                 @click="handleClickTreeItem"
            >
                <div class="contents-wrapper">
                    <div class="left-part">
                        <p-i class="dashboard-icon"
                             :name="Array.isArray(node.children) ? 'ic_folder' : 'ic_service_dashboard'"
                             :color="gray[600]"
                             width="1rem"
                             height="1rem"
                        />
                        <p-i v-if="props.readonlyMode && node.id.startsWith('private')"
                             name="ic_lock-filled"
                             width="0.75rem"
                             height="0.75rem"
                             :color="gray[500]"
                        />
                        <span class="text">{{ node.data.name }}</span>
                        <div v-if="node.data.isNew">
                            <new-mark class="new-mark" />
                        </div>
                        <p-i v-if="!props.disableLink && node.data.type === 'DASHBOARD' && props.readonlyMode"
                             name="ic_arrow-right-up"
                             width="0.75rem"
                             height="0.75rem"
                        />
                        <div class="hidden-wrapper">
                            <favorite-button v-if="node.data.type === 'DASHBOARD' && !props.readonlyMode"
                                             :item-id="node.data.id"
                                             :favorite-type="FAVORITE_TYPE.DASHBOARD"
                                             scale="0.8"
                            />
                            <span v-if="node.data.shared"
                                  class="shared-text"
                                  :style="{'color': getSharedColor(node)}"
                            >- {{ getSharedText(node) }}</span>
                        </div>
                    </div>
                    <div class="right-part">
                        <div v-if="props.treeData.data.type === 'FOLDER'"
                             class="folder-button-wrapper hidden-wrapper"
                        >
                            <p-icon-button v-for="controlButton in state.folderControlButtons"
                                           :key="`folder-control-button-${node.data.id}-${controlButton.name}`"
                                           :name="controlButton.icon"
                                           size="sm"
                                           style-type="tertiary"
                                           shape="square"
                                           @click.stop="controlButton.clickEvent"
                            />
                        </div>
                        <template v-else>
                            <div class="flex gap-1">
                                <p-label v-for="label in node.data?.labels?.slice(0, LABELS_LIMIT)"
                                         :key="`${node.data.id}-label-${label}`"
                                         :text="label"
                                         :clickable="!props.readonlyMode"
                                         @item-click="handleClickLabel(label)"
                                />

                                <p-popover v-if="state.showMoreLabels"
                                           position="bottom-end"
                                >
                                    <p-label :text="`+${node.data.labels.length - LABELS_LIMIT}`"
                                             clickable
                                    />
                                    <template #content>
                                        <div class="popper-label-wrapper">
                                            <p-label v-for="label in node.data.labels.slice(LABELS_LIMIT)"
                                                     :key="`${node.data.id}-label-${label}`"
                                                     :text="label"
                                                     :clickable="!props.readonlyMode"
                                                     @item-click="handleClickLabel(label)"
                                            />
                                        </div>
                                    </template>
                                </p-popover>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </template>
    </p-tree-item>
</template>

<style lang="postcss" scoped>
.dashboard-folder-tree-item {
    .dashboard-folder-tree-item-content {
        position: relative;
        padding: 0.5rem 0;
        .contents-wrapper {
            position: relative;
            height: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            .left-part {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                .dashboard-icon {
                    min-width: 0.875rem;
                }
                .text {
                    @apply text-gray-900;
                    font-size: 0.875rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .new-mark {
                    margin-left: 0;
                }
            }
            .right-part {
                display: flex;
                align-items: center;
                .popper-label-wrapper {
                    display: grid;
                    gap: 0.25rem;
                    min-width: 8rem;
                }
            }
        }
    }
    .hidden-wrapper {
        display: flex;
        gap: 0.25rem;
        align-items: center;
        visibility: hidden;
        .shared-text {
            @apply text-label-sm;
        }
    }
    &:hover {
        .hidden-wrapper {
            visibility: visible;
        }
    }

    @screen tablet {
        .dashboard-folder-tree-item-content {
            .contents-wrapper {
                flex-flow: wrap;
                gap: 0.5rem;
                height: auto;
                .left-part {
                    width: 95%;
                }
            }
        }
        .hidden-wrapper {
            .shared-text {
                display: none;
            }
        }
        .folder-button-wrapper {
            position: absolute;
            right: 0;
            top: -0.25rem;
            display: flex;
            gap: 0.25rem;
        }
    }
}
</style>
