import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { translateDOMElement } from '../lib/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('sitesync_language') || 'en'
    } catch {
      return 'en'
    }
  })

  const observerRef = useRef(null)

  // 1. Direct Instant Live DOM Translator + Mutation Observer
  const applyDomTranslation = useCallback((lang) => {
    if (typeof document === 'undefined') return

    // Run direct DOM translation on root
    translateDOMElement(document.body, lang)

    // Disconnect any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    // If Hindi, observe DOM mutations (e.g. tab switches, dynamic tables, modals)
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
        }, 30)
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false,
      })

      observerRef.current = observer
    }
  }, [])

  // 2. Google Translate Cookie & Combo Trigger
  const applyGoogleTranslate = useCallback((lang) => {
    try {
      const domain = window.location.hostname
      const cookieVal = lang === 'hi' ? '/en/hi' : '/en/en'

      document.cookie = `googtrans=${cookieVal}; path=/;`
      document.cookie = `googtrans=${cookieVal}; path=/; domain=.${domain};`
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain};`

      const select = document.querySelector('.goog-te-combo')
      if (select) {
        select.value = lang
        select.dispatchEvent(new Event('change'))
      } else {
        setTimeout(() => {
          const retrySelect = document.querySelector('.goog-te-combo')
          if (retrySelect) {
            retrySelect.value = lang
            retrySelect.dispatchEvent(new Event('change'))
          }
        }, 500)
      }
    } catch (err) {
      console.warn('[Google Translate Trigger]:', err.message)
    }
  }, [])

  const setLanguage = (lang) => {
    const target = lang === 'hi' ? 'hi' : 'en'
    setLanguageState(target)
    try {
      localStorage.setItem('sitesync_language', target)
    } catch (_) {}

    applyDomTranslation(target)
    applyGoogleTranslate(target)
  }

  const toggleLanguage = () => {
    const nextLang = language === 'hi' ? 'en' : 'hi'
    setLanguage(nextLang)
  }

  // Initial & Route change effect
  useEffect(() => {
    applyDomTranslation(language)
    applyGoogleTranslate(language)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [language, applyDomTranslation, applyGoogleTranslate])

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
