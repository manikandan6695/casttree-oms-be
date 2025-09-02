export enum EMixedPanelEvents {
    feedback_expert_detail_view = "feedback_expert_detail_view",
    learn_homepage_success = "learn_homepage_success",
    initiate_payment = "initiate_payment",
    payment_success="payment_success",
    initiate_episode="initiate_episode",
    episode_complete="episode_complete",
    series_complete="series_complete",
    subscription_end = "subscription_remove",
    subscription_add = "subscription_add",
    mandate_cancelled = "mandate_cancelled",
    coin_purchase_success = "coin_purchase_success",
    meta_event_sent = "meta_event_sent",
}
  
export const ESMixedPanelEvents = [
    EMixedPanelEvents.feedback_expert_detail_view,
    EMixedPanelEvents.learn_homepage_success,
    EMixedPanelEvents.initiate_payment,
    EMixedPanelEvents.payment_success,
    EMixedPanelEvents.initiate_episode,
    EMixedPanelEvents.episode_complete,
    EMixedPanelEvents.series_complete,
    EMixedPanelEvents.subscription_end,
    EMixedPanelEvents.mandate_cancelled,
];