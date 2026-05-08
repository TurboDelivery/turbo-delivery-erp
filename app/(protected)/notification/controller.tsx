

import { fetchAllNotifcation } from "@/src/actions/notification.action";
import { NotificationVM } from "@/types/notification.model";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function useNotificationController(intialNotification: NotificationVM[]) {

    return {
        intialNotification
    }

}