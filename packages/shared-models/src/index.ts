export interface BaseEvent {
  anonymousId?: string
  context?: {
    active?: boolean
    app?: {
      name?: string
      version?: string
      build?: string
      namespace?: string
    }
    campaign?: {
      name?: string
      source?: string
      medium?: string
      term?: string
      content?: string
    }
    device?: {
      id?: string
      advertisingId?: string
      adTrackingEnabled?: boolean
      manufacturer?: string
      model?: string
      name?: string
      type?: string
      token?: string
    }
    ip?: string
    library?: {
      name?: string
      version?: string
    }
    locale?: string
    network?: {
      bluetooth?: boolean
      carrier?: string
      cellular?: boolean
      wifi?: boolean
    }
    os?: {
      name?: string
      version?: string
    }
    page?: {
      path?: string
      referrer?: string
      search?: string
      title?: string
      url?: string
    }
    referrer?: {
      id?: string
      type?: string
    }
    screen?: {
      width?: number
      height?: number
      density?: number
    }
    groupId?: string
    timezone?: string
    userAgent?: string
    userAgentData?: {
      brands?: {
        brand?: string
        version?: string
      }[]
      mobile?: boolean
      platform?: string
    }
  }
  integrations?: {
    All?: boolean
    Mixpanel?: boolean
    Salesforce?: boolean
  }
  event?: string
  messageId?: string
  receivedAt?: string
  sentAt?: string
  timestamp?: string
  type: 'track' | 'identify' | 'group'
  userId?: string
  groupId?: string
  properties?: {
    [key: string]: any
  }
  traits?: {
    [key: string]: any
  }
  instanceId?: string
}
