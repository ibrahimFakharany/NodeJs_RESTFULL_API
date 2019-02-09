class Constants {
}
    // contexts names 
    Constants.handling_mail_context = "handling_mails";
    Constants.getting_mails = "getting_mails";
    Constants.get_contacts_context = "getting_contacts";
    Constants.handling_subject_context = "handling_subject";
    Constants.handling_registration_context = "handling_registration";

    // intents names
    Constants.emailMessagesGetText = 'email.messages.get';
    Constants.emailMessagesGetDateText = 'email.messages.get.date';
    Constants.emailMessagesGetContactNameText = 'email.messages.get.contact_name';
    Constants.emailMessagesGetCountSingleText = 'email.messages.get.count.single';
    Constants.emailMessagesGetCountManyText = 'email.messages.get.contact_name.count.many';
    Constants.emailMessagesGetDateContactNameText = 'email.messages.get.date.contact_name'
    Constants.emailMessagesGetContactNameCountSingleText = 'email.messages.get.contact_name.count.single';
    Constants.emailMessagesGetContactNameCountManyText = 'email.messages.get.contact_name.count.many'
    Constants.emailMessagesGetDateCountSingleText = 'email.messages.get.date.count.single';
    Constants.emailMessagesGetDateCountManyText = 'email.messages.get.date.count.many';
    Constants.emailMessagesGetDateContactNameCountSingleText = 'email.messages.get.date.contact_name.count.single';
    Constants.emailMessagesGetDateContactNameCountManyText = 'email.messages.get.date.contact_name.count.many'
    Constants.emailMessagesShowBody = "email.messages.showBody";
    Constants.emailMessagesShowBodyFromListText = "email.messages.show_body_from_list";
    Constants.userRegistrationText = "user.registration";

    //getting messages followup intents 
    Constants.emailMessagesGetFollowupDateText = 'email.messages.get.followup.date'
    Constants.emailMessagesGetFollowupContactNameText = 'email.messages.get.followup.contact_name'
    Constants.emailMessagesGetFollowupCountText = 'email.messages.get.followup.count'
    Constants.emailMessagesGetFollowupContactNameCountText = 'email.messages.get.followup.contact_name.count'
    Constants.emailMessagesGetFollowupDateCountText = 'email.messages.get.followup.date.count'
    Constants.emailMessagesGetFollowupDateContactNameText = 'email.messages.get.followup.date.contact_name'
    Constants.emailMessagesGetFollowupDateContactNameCountText = 'email.messages.get.followup.date.contact_name.count'

    Constants.default_context_life_span = 5



module.exports = Constants;
