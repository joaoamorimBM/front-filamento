(ns front-filamentos.routes.home
  (:require
   [front-filamentos.layout :as layout]
   [clojure.java.io :as io]
   [front-filamentos.middleware :as middleware]
   [ring.util.response]
   [ring.util.http-response :as response]))



(defn home-page [request]
  (layout/render request "home.html"))

(defn about-page [request]
  (layout/render request "about.html"))

(defn home-routes []
  [ "" 
   {:middleware [middleware/wrap-csrf
                 middleware/wrap-formats
                 ]}
  
   ["/about" {:get about-page}]
   ["/filamentos"
    {:get (fn [req]
            (layout/render req "filamentos.html"))}]
   ;; LOGIN
   ["/" {:get (fn [req] (layout/render req "login.html"))}]
   ["/login" {:get (fn [req] (layout/render req "login.html"))}]
   ["/verify" {:get (fn [req] (layout/render req "verify.html"))}]
   ["/home" {:get (fn [req] (layout/render req "home.html"))}]






   ])

["/about" {:get about-page}]