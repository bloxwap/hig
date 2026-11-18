/** Choose a HIG Select option through its visible custom popup. */
export async function selectHIGOption(page,label,optionLabel){
 const trigger=page.getByRole('combobox',{name:label,exact:true});
 await trigger.click();
 const option=page.getByRole('listbox').getByRole('option',{name:optionLabel,exact:true});
 if(!await option.count())await trigger.pressSequentially(optionLabel);
 await option.click();
}
