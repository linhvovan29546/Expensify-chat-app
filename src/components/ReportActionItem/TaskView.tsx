import React, {useEffect} from 'react';
import {View} from 'react-native';
import Checkbox from '@components/Checkbox';
import Hoverable from '@components/Hoverable';
import Icon from '@components/Icon';
import * as Expensicons from '@components/Icon/Expensicons';
import MenuItem from '@components/MenuItem';
import MenuItemWithTopDescription from '@components/MenuItemWithTopDescription';
import OfflineWithFeedback from '@components/OfflineWithFeedback';
import {usePersonalDetails} from '@components/OnyxProvider';
import PressableWithSecondaryInteraction from '@components/PressableWithSecondaryInteraction';
import Text from '@components/Text';
import useCurrentUserPersonalDetails from '@hooks/useCurrentUserPersonalDetails';
import useLocalize from '@hooks/useLocalize';
import useStyleUtils from '@hooks/useStyleUtils';
import useThemeStyles from '@hooks/useThemeStyles';
import convertToLTR from '@libs/convertToLTR';
import getButtonState from '@libs/getButtonState';
import Navigation from '@libs/Navigation/Navigation';
import * as OptionsListUtils from '@libs/OptionsListUtils';
import * as ReportUtils from '@libs/ReportUtils';
import * as TaskUtils from '@libs/TaskUtils';
import * as Session from '@userActions/Session';
import * as Task from '@userActions/Task';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';
import type {Report} from '@src/types/onyx';

type TaskViewProps = {
    /** The report currently being looked at */
    report: Report;
};

function TaskView({report}: TaskViewProps) {
    const styles = useThemeStyles();
    const StyleUtils = useStyleUtils();
    const currentUserPersonalDetails = useCurrentUserPersonalDetails();
    const personalDetails = usePersonalDetails();
    useEffect(() => {
        Task.setTaskReport(report);
    }, [report]);
    const taskTitle = convertToLTR(report.reportName ?? '');
    const assigneeTooltipDetails = ReportUtils.getDisplayNamesWithTooltips(
        OptionsListUtils.getPersonalDetailsForAccountIDs(report.managerID ? [report.managerID] : [], personalDetails),
        false,
    );
    const isOpen = ReportUtils.isOpenTaskReport(report);
    const isCompleted = ReportUtils.isCompletedTaskReport(report);
    const canModifyTask = Task.canModifyTask(report, currentUserPersonalDetails.accountID);
    const canActionTask = Task.canActionTask(report, currentUserPersonalDetails.accountID);
    const disableState = !canModifyTask;
    const isDisableInteractive = !canModifyTask || !isOpen;
    const {translate} = useLocalize();

    return (
        <View>
            <OfflineWithFeedback
                shouldShowErrorMessages
                errors={report.errorFields?.editTask ?? report.errorFields?.createTask}
                onClose={() => Task.clearTaskErrors(report.reportID)}
                errorRowStyles={styles.ph5}
            >
                <Hoverable>
                    {(hovered) => (
                        <PressableWithSecondaryInteraction
                            onPress={Session.checkIfActionIsAllowed((e) => {
                                if (isDisableInteractive) {
                                    return;
                                }
                                if (e && e.type === 'click') {
                                    (e.currentTarget as HTMLElement).blur();
                                }

                                Navigation.navigate(ROUTES.TASK_TITLE.getRoute(report.reportID, Navigation.getReportRHPActiveRoute()));
                            })}
                            style={({pressed}) => [
                                styles.ph5,
                                styles.pv2,
                                StyleUtils.getButtonBackgroundColorStyle(getButtonState(hovered, pressed, false, disableState, !isDisableInteractive), true),
                                isDisableInteractive && styles.cursorDefault,
                            ]}
                            accessibilityLabel={taskTitle || translate('task.task')}
                            disabled={isDisableInteractive}
                        >
                            {({pressed}) => (
                                <OfflineWithFeedback pendingAction={report.pendingFields?.reportName}>
                                    <Text style={styles.taskTitleDescription}>{translate('task.title')}</Text>
                                    <View style={[styles.flexRow, styles.flex1]}>
                                        <Checkbox
                                            onPress={Session.checkIfActionIsAllowed(() => {
                                                // If we're already navigating to these task editing pages, early return not to mark as completed, otherwise we would have not found page.
                                                if (TaskUtils.isActiveTaskEditRoute(report.reportID)) {
                                                    return;
                                                }
                                                if (isCompleted) {
                                                    Task.reopenTask(report);
                                                } else {
                                                    Task.completeTask(report);
                                                }
                                            })}
                                            isChecked={isCompleted}
                                            style={styles.taskMenuItemCheckbox}
                                            containerSize={24}
                                            containerBorderRadius={8}
                                            caretSize={16}
                                            accessibilityLabel={taskTitle || translate('task.task')}
                                            disabled={!canActionTask}
                                        />
                                        <View style={[styles.flexRow, styles.flex1]}>
                                            <Text
                                                numberOfLines={3}
                                                style={styles.taskTitleMenuItem}
                                            >
                                                {taskTitle}
                                            </Text>
                                        </View>
                                        {!isDisableInteractive && (
                                            <View style={styles.taskRightIconContainer}>
                                                <Icon
                                                    additionalStyles={[styles.alignItemsCenter]}
                                                    src={Expensicons.ArrowRight}
                                                    fill={StyleUtils.getIconFillColor(getButtonState(hovered, pressed, false, disableState))}
                                                />
                                            </View>
                                        )}
                                    </View>
                                </OfflineWithFeedback>
                            )}
                        </PressableWithSecondaryInteraction>
                    )}
                </Hoverable>
                <OfflineWithFeedback pendingAction={report.pendingFields?.description}>
                    <MenuItemWithTopDescription
                        shouldRenderAsHTML
                        description={translate('task.description')}
                        title={report.description ?? ''}
                        onPress={() => Navigation.navigate(ROUTES.REPORT_DESCRIPTION.getRoute(report.reportID, Navigation.getReportRHPActiveRoute()))}
                        shouldShowRightIcon={!isDisableInteractive}
                        disabled={disableState}
                        wrapperStyle={[styles.pv2, styles.taskDescriptionMenuItem]}
                        shouldGreyOutWhenDisabled={false}
                        numberOfLinesTitle={0}
                        interactive={!isDisableInteractive}
                        shouldUseDefaultCursorWhenDisabled
                    />
                </OfflineWithFeedback>
                <OfflineWithFeedback pendingAction={report.pendingFields?.managerID}>
                    {report.managerID ? (
                        <MenuItem
                            label={translate('task.assignee')}
                            title={ReportUtils.getDisplayNameForParticipant(report.managerID)}
                            icon={OptionsListUtils.getAvatarsForAccountIDs([report.managerID], personalDetails)}
                            iconType={CONST.ICON_TYPE_AVATAR}
                            avatarSize={CONST.AVATAR_SIZE.SMALLER}
                            titleStyle={styles.assigneeTextStyle}
                            onPress={() => Navigation.navigate(ROUTES.TASK_ASSIGNEE.getRoute(report.reportID, Navigation.getReportRHPActiveRoute()))}
                            shouldShowRightIcon={!isDisableInteractive}
                            disabled={disableState}
                            wrapperStyle={[styles.pv2]}
                            isSmallAvatarSubscriptMenu
                            shouldGreyOutWhenDisabled={false}
                            interactive={!isDisableInteractive}
                            titleWithTooltips={assigneeTooltipDetails}
                            shouldUseDefaultCursorWhenDisabled
                        />
                    ) : (
                        <MenuItemWithTopDescription
                            description={translate('task.assignee')}
                            onPress={() => Navigation.navigate(ROUTES.TASK_ASSIGNEE.getRoute(report.reportID, Navigation.getReportRHPActiveRoute()))}
                            shouldShowRightIcon={!isDisableInteractive}
                            disabled={disableState}
                            wrapperStyle={[styles.pv2]}
                            shouldGreyOutWhenDisabled={false}
                            interactive={!isDisableInteractive}
                            shouldUseDefaultCursorWhenDisabled
                        />
                    )}
                </OfflineWithFeedback>
            </OfflineWithFeedback>
        </View>
    );
}

TaskView.displayName = 'TaskView';

export default TaskView;
