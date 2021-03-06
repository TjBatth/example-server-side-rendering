(ns keechma-ssr.core
  (:require
    [keechma-ssr.config :refer [env]]
    [keechma-ssr.middleware :refer [wrap-defaults]]
    [keechma-ssr.routes :refer [router]]
    [macchiato.server :as http]
    [macchiato.session.memory :as mem]
    [mount.core :as mount :refer [defstate]]
    [taoensso.timbre :refer-macros [log trace debug info warn error fatal]]))

(defn app []
  (mount/start)
  (let [host (or (:host @env) "127.0.0.1")
        port (or (some-> @env :port js/parseInt) 3000)]
    (http/start
      {:handler    (wrap-defaults router)
       :host       host
       :port       port
       :on-success #(info "keechma-ssr started on" host ":" port)})))

(defn start-workers [cluster]
  (let [os (js/require "os")]
    (dotimes [_ (get-in @env [:cluster :procs] (-> os .cpus .-length))]
      (.fork cluster))
    (.on cluster "exit"
      (fn [worker code signal]
        (info "worker terminated" (-> worker .-process .-pid))))))

(defn main [& args]
  (if (:cluster @env)
    (let [cluster (js/require "cluster")]
      (if (.-isMaster cluster)
        (start-workers cluster)
        (app)))
    (app)))
