type AppThemeConfig = {
  token: {
    colorPrimary: string
    colorInfo: string
    colorSuccess: string
    colorWarning: string
    colorError: string
    colorText: string
    colorBgBase: string
    colorBgContainer: string
    borderRadius: number
  }
  components: Record<string, Record<string, string | number>>
}

export const UI_COLORS = {
  primary: '#4A7FA5',
  neonGreen: '#39E03A',
  skyBlue: '#5B9EC9',
  darkBg: '#0F1923',
  lightBg: '#F4F7FA',
  text: '#1A2535',
  danger: '#E53E3E',
  success: '#2D882E',
  warning: '#E8A820'
} as const

export const APP_THEME: AppThemeConfig = {
  token: {
    colorPrimary: UI_COLORS.primary,
    colorInfo: UI_COLORS.skyBlue,
    colorSuccess: UI_COLORS.success,
    colorWarning: UI_COLORS.warning,
    colorError: UI_COLORS.danger,
    colorText: UI_COLORS.text,
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    borderRadius: 10
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: UI_COLORS.darkBg,
      bodyBg: UI_COLORS.lightBg,
      triggerBg: UI_COLORS.primary,
      triggerColor: '#ffffff'
    },
    Menu: {
      itemSelectedColor: UI_COLORS.primary,
      itemActiveBg: '#e7f0f6'
    },
    Button: {
      primaryColor: '#ffffff',
      defaultBorderColor: '#c8d4de'
    }
  }
}
