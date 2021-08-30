export const html = (subject: string, dear: String, body1: string, url: string) => {
  let data = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml" lang="en">
<head>
  <link rel="stylesheet" type="text/css" hs-webfonts="true" href="https://fonts.googleapis.com/css2?family=Kanit:wght@100;200;300;400;500;600&display=swap">
  <title>MUNMOO ERP: ${subject}</title>
  <meta property="og:title" content="MUNMOO ERP: ${subject}">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@100;200;300;400;500;600&display=swap');
    [style*='Kanit'] {
      font-family: 'Kanit', 'Thai Sarabun New', 'Cordia New' !important;
    }
    a{ 
      text-decoration: underline;
      color: inherit;
      font-weight: bold;
      color: #253342;
    }
    
    h1 {
      font-size: 56px;
    }
    
      h2{
      font-size: 28px;
      font-weight: 900; 
    }
    
    p {
      font-weight: 100;
    }
    
    td {
  vertical-align: top;
    }
    
    #email {
      margin: auto;
      width: 600px;
      background-color: white;
    }
    
    button{
      font: inherit;
      background-color: #FF7A59;
      border: none;
      padding: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 900; 
      color: white;
      border-radius: 5px; 
      box-shadow: 3px 3px #d94c53;
    }

    .btn{
      font: inherit;
      background-color: #FF7A59;
      border: none;
      padding: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 900; 
      color: white;
      border-radius: 5px; 
      box-shadow: 3px 3px #d94c53;
    }
    
    .subtle-link {
      font-size: 9px; 
      text-transform:uppercase; 
      letter-spacing: 1px;
      color: #CBD6E2;
    }
    
  </style>
  
</head>
  <body bgcolor="#F5F8FA" style="width: 100%; margin: auto 0; padding:0; font-family:'Thai Sarabun New', 'Kanit';font-weight: 200; font-size:18px; color:#33475B; word-break:break-word">


  <! Banner --> 
  <table role="presentation" width="100%">
     <tr>
  
       <td bgcolor="#2C345F" align="center" style="color: white;">
         <h1> สวัสดีค่ะ ${dear}</h1>
         
       </td>
 </table>




  <! First Row --> 

<table role="presentation" border="0" cellpadding="0" cellspacing="10px" style="padding: 30px 30px 30px 60px;">
   <tr>
     <td>
      <h2>${subject}</h2>
      <h4>เรียน ${dear}</h4>
          <p>
            ${body1}
          </p>
              <a class="btn" href="${url}"> 
                ตรวจสอบ
              </a>
        </td> 
        </tr>
               </table>

   
      <! Banner Row --> 
<table role="presentation" bgcolor="#9FA3D1" width="100%" style="margin-top: 50px;" >
    <tr>
        <td align="center" style="padding: 30px 30px;">
          
       <h2> MUNMOO ERP </h2>
          <p>อีเมลฉบับนี้ถูกส่งด้วยระบบบริหารของอจน. สอบถามเพิ่มเติมกรุณาติดต่อ</p>
            <a href="https://inco.wma.go.th"> องค์การจัดการน้ำเสีย</a>      
        </td>
        </tr>
    </table>

    </div>
  </body>
    </html>
    `;
  return data
}
