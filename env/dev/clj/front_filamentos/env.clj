(ns front-filamentos.env
  (:require
    [selmer.parser :as parser]
    [clojure.tools.logging :as log]
    [front-filamentos.dev-middleware :refer [wrap-dev]]))

(def defaults
  {:init
   (fn []
     (parser/cache-off!)
     (log/info "\n-=[front-filamentos started successfully using the development profile]=-"))
   :stop
   (fn []
     (log/info "\n-=[front-filamentos has shut down successfully]=-"))
   :middleware wrap-dev})
