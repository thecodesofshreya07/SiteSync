import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { translateDOMElement } from '../lib/translations'

const LanguageContext = createContext()

function setGoogleTranslateCookie(lang) {
  const cookieVal = lang === 'hi' ? '/en/hi' : '/en/en'
  const domain = window.location.hostname

  document.cookie = `googtrans=${cookieVal}; path=/;`
  document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain};`
  document.cookie = `googtrans=${cookieVal}; path=/; domain=.${domain};`
}

function clearGoogleTranslateCookie() {
  const domain = window.location.hostname
  document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
  document.cookie = `googtrans=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
  document.cookie = `googtrans=; path=/; domain=.${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('sitesync_language') || 'en'
    } catch {
      return 'en'
    }
  })

  const observerRef = useRef(null)

  // 1. Direct Instant DOM Translation
  const applyDomTranslation = useCallback((lang) => {
    if (typeof document === 'undefined') return

    translateDOMElement(document.body, lang)

    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    if (lang === 'hi') {
      let timeout = null
      const observer = new MutationObserver((mutations) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                translateDOMElement(node, 'hi')
              }
            })
          })
        }, 20)
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false,
      })

      observerRef.current = observer
    }
  }, [])

  // 2. Google Translate Trigger
  const triggerGoogleTranslate = useCallback((lang) => {
    try {
      setGoogleTranslateCookie(lang)

      const select = document.querySelector('.goog-te-combo')
      if (select) {
        select.value = lang
        select.dispatchEvent(new Event('change'))
        select.dispatchEvent(new Event('input'))
      }
    } catch (err) {
      console.warn('[Translate Trigger]:', err.message)
    }
  }, [])

  const setLanguage = (lang) => {
    const target = lang === 'hi' ? 'hi' : 'en'
    setLanguageState(target)

    try {
      localStorage.setItem('sitesync_language', target)
    } catch (_) {}

    if (target === 'hi') {
      setGoogleTranslateCookie('hi')
      applyDomTranslation('hi')
      triggerGoogleTranslate('hi')
      // Quick reload to ensure 100% full-page translation on all React trees
      setTimeout(() => {
        window.location.reload()
      }, 50)
    } else {
      clearGoogleTranslateCookie()
      setGoogleTranslateCookie('en')
      applyDomTranslation('en')
      triggerGoogleTranslate('en')
      // Quick reload to restore pure English state
      setTimeout(() => {
        window.location.reload()
      }, 50)
    }
  }

  const toggleLanguage = () => {
    const next = language === 'hi' ? 'en' : 'hi'
    setLanguage(next)
  }

  // Initial mount translation sync
  useEffect(() => {
    if (language === 'hi') {
      setGoogleTranslateCookie('hi')
      applyDomTranslation('hi')
      triggerGoogleTranslate('hi')
    } else {
      applyDomTranslation('en')
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [language, applyDomTranslation, triggerGoogleTranslate])

  return (
    <LanguageContext.Provider
      value={{
        language,
        isHindi: language === 'hi',
        setLanguage,
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}

export default LanguageContext
