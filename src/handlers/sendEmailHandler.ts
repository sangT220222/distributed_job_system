type JobDataContent = {
  email_address: string;
  email_data: string;
};

export async function emailHandler(data: JobDataContent) {
  //placeholder - mimic an email sending process
  console.log(`sending email to ${data.email_address}`);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(`Email sent to ${data.email_address}`);
}
