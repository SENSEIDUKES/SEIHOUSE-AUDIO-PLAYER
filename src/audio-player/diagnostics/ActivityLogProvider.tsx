import { useRef } from "react"
import type { ReactNode } from "react"
import type { ActivityLogApi, ActivityLogConfig } from "./activityTypes"
import { createActivityLogStore } from "./activityLogStore"
import { ActivityLogContext } from "./useActivityLog"

export interface ActivityLogProviderProps {
    children: ReactNode
    config?: Partial<ActivityLogConfig>
}

export function ActivityLogProvider({ children, config }: ActivityLogProviderProps) {
    const storeRef = useRef<ActivityLogApi | null>(null)
    if (storeRef.current === null) {
        storeRef.current = createActivityLogStore(config)
    }
    return (
        <ActivityLogContext.Provider value={storeRef.current}>
            {children}
        </ActivityLogContext.Provider>
    )
}
