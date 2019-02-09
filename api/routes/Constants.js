class Constants {

    // contexts names 
    static handling_mail_context = "handling_mails";
    static getting_mails = "getting_mails";
    static get_contacts_context = "getting_contacts";
    static handling_subject_context = "handling_subject";
    static handling_registration_context = "handling_registration";

    // intents names
    static emailMessagesGetText = 'email.messages.get';
    static emailMessagesGetDateText = 'email.messages.get.date';
    static emailMessagesGetContactNameText = 'email.messages.get.contact_name';
    static emailMessagesGetCountSingleText = 'email.messages.get.count.single';
    static emailMessagesGetCountManyText = 'email.messages.get.contact_name.count.many';
    static emailMessagesGetDateContactNameText = 'email.messages.get.date.contact_name'
    static emailMessagesGetContactNameCountSingleText = 'email.messages.get.contact_name.count.single';
    static emailMessagesGetContactNameCountManyText = 'email.messages.get.contact_name.count.many'
    static emailMessagesGetDateCountSingleText = 'email.messages.get.date.count.single';
    static emailMessagesGetDateCountManyText = 'email.messages.get.date.count.many';
    static emailMessagesGetDateContactNameCountSingleText = 'email.messages.get.date.contact_name.count.single';
    static emailMessagesGetDateContactNameCountManyText = 'email.messages.get.date.contact_name.count.many'
    static emailMessagesShowBody = "email.messages.showBody";
    static emailMessagesShowBodyFromListText = "email.messages.show_body_from_list";
    static userRegistrationText = "user.registration";

    //getting messages followup intents 
    static emailMessagesGetFollowupDateText = 'email.messages.get.followup.date'
    static emailMessagesGetFollowupContactNameText = 'email.messages.get.followup.contact_name'
    static emailMessagesGetFollowupCountText = 'email.messages.get.followup.count'
    static emailMessagesGetFollowupContactNameCountText = 'email.messages.get.followup.contact_name.count'
    static emailMessagesGetFollowupDateCountText = 'email.messages.get.followup.date.count'
    static emailMessagesGetFollowupDateContactNameText = 'email.messages.get.followup.date.contact_name'
    static emailMessagesGetFollowupDateContactNameCountText = 'email.messages.get.followup.date.contact_name.count'

    static default_context_life_span = 5

}

module.exports = Constants 
2
