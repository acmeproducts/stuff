function openS3(){
  populateLangSelects();
  $('s3-my').value='en';$('s3-their').value='th';
  $('s3-autoread').classList.remove('on');
  $('m-s3').classList.add('show');
}
