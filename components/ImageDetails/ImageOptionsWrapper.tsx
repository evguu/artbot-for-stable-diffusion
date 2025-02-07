import clsx from 'clsx'
import { Menu, MenuItem, MenuButton, MenuDivider } from '@szhsin/react-menu'
import '@szhsin/react-menu/dist/index.css'
import '@szhsin/react-menu/dist/transitions/slide.css'

import ConfirmationModal from 'components/ConfirmationModal'
import CopyIcon from 'components/icons/CopyIcon'
import DotsVerticalIcon from 'components/icons/DotsVerticalIcon'
import DownloadIcon from 'components/icons/DownloadIcon'
import HeartIcon from 'components/icons/HeartIcon'
import TrashIcon from 'components/icons/TrashIcon'
import { useCallback, useEffect, useState } from 'react'
import { IImageDetails } from 'types'
import {
  deleteCompletedImageById,
  deletePendingJobFromDb,
  getImageDetails,
  updateCompletedJob
} from 'utils/db'
import {
  blobToClipboard,
  downloadFile,
  generateBase64Thumbnail
} from 'utils/imageUtils'

import styles from './imageDetails.module.css'
import AppSettings from 'models/AppSettings'
import PromptInputSettings from 'models/PromptInputSettings'
import {
  copyEditPrompt,
  interrogateImage,
  rerollImage,
  uploadImg2Img,
  uploadInpaint,
  upscaleImage
} from 'controllers/imageDetailsCommon'
import { useRouter } from 'next/router'
import WallIcon from 'components/icons/WallIcon'
import ResizeIcon from 'components/icons/ResizeIcon'
import { isiOS } from 'utils/appUtils'
import { SourceProcessing } from 'utils/promptUtils'
import ShareIcon from 'components/icons/ShareIcon'
import ImageParamsForApi from 'models/ImageParamsForApi'
import { userInfoStore } from 'store/userStore'
import { createShortlink } from 'api/createShortlink'
import { toast, ToastOptions } from 'react-toastify'
import RefreshIcon from 'components/icons/RefreshIcon'

const ImageOptionsWrapper = ({
  handleClose,
  handleDeleteImageClick = () => {},
  imageDetails,
  isModal,
  showTiles,
  setShowTiles,
  handleFullScreen
}: {
  handleClose: () => any
  handleDeleteImageClick?: () => any
  imageDetails: IImageDetails
  isModal: boolean
  showTiles: boolean
  setShowTiles: (bool: boolean) => any
  handleFullScreen: () => any
}) => {
  const router = useRouter()

  const [favorited, setFavorited] = useState(imageDetails.favorited)
  const [pendingReroll, setPendingReroll] = useState(false)
  const [pendingUpscale, setPendingUpscale] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [tileSize, setTileSize] = useState('128px')
  const [savedShortlink, setSavedShortlink] = useState('')
  const [shortlinkPending, setShortlinkPending] = useState(false)

  const handleCopyPromptClick = () => {
    if (AppSettings.get('savePromptOnCreate')) {
      PromptInputSettings.set('prompt', imageDetails.prompt)
    }

    copyEditPrompt(imageDetails)
    router.push(`/?edit=true`)
  }

  const handleDeleteImageConfirm = async () => {
    handleDeleteImageClick()
    deletePendingJobFromDb(imageDetails.jobId)
    await deleteCompletedImageById(imageDetails.id)
    handleClose()
  }

  const handleRerollClick = useCallback(
    async (imageDetails: any) => {
      if (pendingReroll) {
        return
      }

      setPendingReroll(true)

      const reRollStatus = await rerollImage(imageDetails)
      const { success } = reRollStatus

      if (success) {
        setPendingReroll(false)
        router.push('/pending')
        handleClose()
      }
    },
    [handleClose, pendingReroll, router]
  )

  const handleTileClick = (size: string) => {
    setTileSize(size)
    setShowTiles(true)
  }

  const handleUpscaleClick = useCallback(async () => {
    if (pendingUpscale) {
      return
    }

    setPendingUpscale(true)

    await upscaleImage(imageDetails)
    router.push('/pending')
  }, [imageDetails, pendingUpscale, router])

  const onFavoriteClick = useCallback(async () => {
    const updateFavorited = !favorited
    setFavorited(updateFavorited)

    await updateCompletedJob(
      imageDetails.id,
      Object.assign({}, imageDetails, {
        favorited: updateFavorited
      })
    )

    // Bust memoization cache
    getImageDetails.delete(imageDetails.jobId)
    await getImageDetails(imageDetails.jobId)
  }, [favorited, imageDetails])

  const copyShortlink = (_shortlink: string) => {
    const hostname =
      window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://tinybots.net'
    navigator?.clipboard
      ?.writeText(`${hostname}/artbot?i=${_shortlink}`)
      .then(() => {
        toast.success('Shortlink URL copied to your clipboard!', {
          pauseOnFocusLoss: false,
          position: 'top-center',
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          progress: undefined,
          theme: 'light'
        })
      })
  }

  const getShortlink = async () => {
    if (imageDetails.shortlink || savedShortlink) {
      copyShortlink(imageDetails.shortlink || savedShortlink)
      return
    }

    if (shortlinkPending) {
      return
    }

    setShortlinkPending(true)

    const resizedImage = await generateBase64Thumbnail(
      imageDetails.base64String,
      imageDetails.jobId,
      512,
      768,
      0.7
    )

    const data = {
      // @ts-ignore
      imageParams: new ImageParamsForApi(imageDetails),
      imageBase64: resizedImage,
      username: userInfoStore.state.username
    }

    const shortlinkData = await createShortlink(data)
    const { shortlink } = shortlinkData

    if (shortlink) {
      await updateCompletedJob(
        imageDetails.id,
        Object.assign({}, imageDetails, {
          shortlink
        })
      )

      copyShortlink(shortlink)
    }

    setShortlinkPending(false)
    setSavedShortlink(shortlink)
  }

  useEffect(() => {
    setFavorited(imageDetails.favorited)
  }, [imageDetails.favorited])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTiles) {
          e.stopImmediatePropagation()
          e.preventDefault()
          setShowTiles(false)
        }
      }

      if (e.key === 'Delete') {
        setShowDeleteModal(true)
      }

      if (e.key === 'f') {
        onFavoriteClick()
      }

      if (e.key === 'd') {
        downloadFile(imageDetails)
      }

      if (e.key === 'r') {
        handleRerollClick(imageDetails)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [
    handleClose,
    handleRerollClick,
    imageDetails,
    onFavoriteClick,
    setShowTiles,
    showTiles
  ])

  return (
    <>
      {showTiles && (
        <div
          className="z-[102] fixed top-0 left-0 right-0 bottom-0 bg-repeat"
          onClick={() => setShowTiles(false)}
          style={{
            backgroundImage: `url("data:image/webp;base64,${imageDetails.base64String}")`,
            backgroundSize: tileSize
          }}
        ></div>
      )}
      {showDeleteModal && (
        <ConfirmationModal
          onConfirmClick={() => {
            setShowDeleteModal(false)
            handleDeleteImageConfirm()
          }}
          closeModal={() => setShowDeleteModal(false)}
        />
      )}
      <div
        id="image-options-wrapper"
        className="mt-3 flex flex-row w-full justify-center"
      >
        <div
          id="image-options-buttons"
          className="w-full flex flex-row items-center justify-between tablet:justify-end max-w-[768px] md:gap-4"
        >
          <div className={styles['button-icon']}>
            <Menu
              menuButton={
                <MenuButton>
                  <DotsVerticalIcon />
                </MenuButton>
              }
              transition
              menuClassName={styles['menu']}
            >
              {isModal && (
                <MenuItem
                  className="text-sm"
                  onClick={() => {
                    router.push(`/image/${imageDetails.jobId}`)
                  }}
                >
                  View image details page
                </MenuItem>
              )}
              <MenuDivider />
              <MenuItem onClick={() => downloadFile(imageDetails)}>
                Download image
              </MenuItem>
              <MenuItem
                className="text-sm"
                onClick={() => handleRerollClick(imageDetails)}
              >
                Reroll this image as a new job
              </MenuItem>
              <MenuItem
                className="text-sm"
                onClick={() => {
                  interrogateImage(imageDetails)
                  router.push(`/interrogate?user-share=true`)
                }}
              >
                Interrogate (img2text)
              </MenuItem>
              <MenuItem className="text-sm" onClick={handleUpscaleClick}>
                Upscale image {pendingUpscale && ' (processing...)'}
              </MenuItem>
              <MenuDivider />
              <MenuItem
                className="text-sm"
                onClick={() => {
                  uploadImg2Img(imageDetails)
                  router.push(`/?panel=img2img&edit=true`)
                }}
              >
                Use for img2img
              </MenuItem>
              <MenuItem
                className="text-sm"
                onClick={() => {
                  uploadInpaint(imageDetails)
                  router.push(`/?panel=inpainting&edit=true`)
                }}
              >
                Use for inpainting
              </MenuItem>
            </Menu>
          </div>
          <div className={styles['button-icon']}>
            <Menu
              menuButton={
                <MenuButton>
                  <CopyIcon />
                </MenuButton>
              }
              transition
              menuClassName={styles['menu']}
            >
              <MenuItem
                className="text-sm"
                onClick={() => {
                  router.push(
                    `/?prompt=${encodeURIComponent(imageDetails.prompt)}`
                  )
                }}
              >
                Use this prompt for generation
              </MenuItem>
              <MenuItem className="text-sm" onClick={handleCopyPromptClick}>
                Use all settings from this image for generation
              </MenuItem>
              <MenuDivider />
              <MenuItem
                className="text-sm"
                onClick={async () => {
                  const success = await blobToClipboard(
                    imageDetails.base64String
                  )

                  const toastObject: ToastOptions = {
                    pauseOnFocusLoss: false,
                    position: 'top-center',
                    autoClose: 2500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: false,
                    progress: undefined,
                    theme: 'light'
                  }

                  if (success) {
                    toast.success(
                      'Image copied to your clipboard!',
                      toastObject
                    )
                  } else {
                    toast.error(
                      'Unable to copy image to clipboard.',
                      toastObject
                    )
                  }
                }}
              >
                Copy image to clipboard
              </MenuItem>
            </Menu>
          </div>
          {imageDetails.source_processing === SourceProcessing.Prompt && (
            <div
              className={styles['button-icon']}
              onClick={async () => {
                getShortlink()
              }}
            >
              <ShareIcon />
            </div>
          )}
          {imageDetails.tiling && (
            <div className={styles['button-icon']}>
              <Menu
                menuButton={
                  <MenuButton>
                    <WallIcon />
                  </MenuButton>
                }
                transition
                menuClassName={styles['menu']}
              >
                <MenuItem
                  className="text-sm"
                  onClick={() => handleTileClick('64px')}
                >
                  64px tiles
                </MenuItem>
                <MenuItem
                  className="text-sm"
                  onClick={() => handleTileClick('128px')}
                >
                  128px tiles
                </MenuItem>
                <MenuItem
                  className="text-sm"
                  onClick={() => handleTileClick('256px')}
                >
                  256px tiles
                </MenuItem>
                <MenuItem
                  className="text-sm"
                  onClick={() => handleTileClick('512px')}
                >
                  512px tiles
                </MenuItem>
                <MenuItem
                  className="text-sm"
                  onClick={() => handleTileClick('1024px')}
                >
                  1024px tiles
                </MenuItem>
              </Menu>
            </div>
          )}
          {!isiOS() && (
            <div className={styles['button-icon']} onClick={handleFullScreen}>
              <ResizeIcon strokeWidth={1.25} />
            </div>
          )}
          <div
            className={clsx(styles['button-icon'], styles['mobile-hide'])}
            onClick={() => downloadFile(imageDetails)}
          >
            <DownloadIcon />
          </div>
          <div
            className={clsx(styles['button-icon'])}
            onClick={() => handleRerollClick(imageDetails)}
          >
            <RefreshIcon />
          </div>
          <div className={styles['button-icon']} onClick={onFavoriteClick}>
            <HeartIcon fill={favorited ? '#14B8A6' : undefined} />
          </div>
          <div
            className={clsx(styles['button-icon'])}
            onClick={() => setShowDeleteModal(true)}
          >
            <TrashIcon />
          </div>
        </div>
      </div>
    </>
  )
}

export default ImageOptionsWrapper
