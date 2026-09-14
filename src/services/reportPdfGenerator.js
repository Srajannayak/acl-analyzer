import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generateReportPdf(elementId = "acl-report-content", customFilename = null) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Report element #${elementId} not found.`);
  }

  // Generate canvas with optimal scale
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Add first page
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= pdfHeight;

  // Add subsequent pages if report exceeds one page
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight;
  }

  const today = new Date().toISOString().slice(0, 10);
  const filename = customFilename || `ACL_Analysis_Report_${today}.pdf`;

  pdf.save(filename);
  return filename;
}
