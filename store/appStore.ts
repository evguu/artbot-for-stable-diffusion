import { makeStore } from 'statery'
import { IClusterSettings } from './clusterSettings'

interface AppStore {
  buildId: string
  indexDbSupport: boolean
  serverMessage: string
  showBetaOption: boolean
  newImageReady: string
  showImageReadyToast: boolean
  stableHordeApiOnline: boolean
  showAppMenu: boolean
  unsupportedBrowser: boolean
  hordePerformance: object
  clusterSettings: IClusterSettings
}

export const appInfoStore = makeStore<AppStore>({
  buildId: '',
  indexDbSupport: true,
  serverMessage: '',
  showBetaOption: false,
  newImageReady: '',
  showImageReadyToast: false,
  stableHordeApiOnline: true,
  showAppMenu: false,
  unsupportedBrowser: false,
  hordePerformance: {},
  clusterSettings: {
    forceReloadOnServerUpdate: true
  }
})

export const setClusterSettings = (obj: IClusterSettings) => {
  appInfoStore.set(() => ({
    clusterSettings: obj
  }))
}

export const setHordePerformance = (obj: object) => {
  appInfoStore.set(() => ({
    hordePerformance: obj
  }))
}

export const setUnsupportedBrowser = (val: boolean = false) => {
  appInfoStore.set(() => ({
    unsupportedBrowser: val
  }))
}

export const setShowAppMenu = (val: boolean = false) => {
  appInfoStore.set(() => ({
    showAppMenu: val
  }))
}

export const setShowBetaOption = (val: boolean) => {
  appInfoStore.set(() => ({
    showBetaOption: val
  }))
}

export const setBuildId = (id: string) => {
  appInfoStore.set(() => ({
    buildId: id
  }))
}

export const setHordeStatus = (val: boolean) => {
  appInfoStore.set(() => ({
    stableHordeApiOnline: val
  }))
}

export const setServerMessage = (message: string) => {
  if (appInfoStore.state.serverMessage === message) {
    return
  }

  appInfoStore.set(() => ({
    serverMessage: message
  }))
}

export const setIndexDbSupport = (bool: boolean) => {
  appInfoStore.set(() => ({
    indexDbSupport: bool
  }))
}

export const setShowImageReadyToast = (bool: boolean) => {
  if (appInfoStore.state.showImageReadyToast === bool) {
    return
  }

  appInfoStore.set(() => ({
    showImageReadyToast: bool
  }))
}

export const setNewImageReady = (jobId: string) => {
  // Attempt to prevent race condition when PendingItems component
  // tries to update the toast. For some reason, it's not
  // getting the correct state.

  if (jobId && appInfoStore.state.showImageReadyToast) {
    return
  }

  appInfoStore.set(() => ({
    newImageReady: jobId,
    showImageReadyToast: jobId ? true : false
  }))
}
