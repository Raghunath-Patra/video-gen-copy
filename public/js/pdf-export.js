/**
 * PDF Export Module for Educational Video Generator
 * Handles PDF generation from script slides with comprehensive formatting
 */

class PDFExporter {
    constructor() {
        this.pdf = null;
        this.currentProject = null;
        this.slides = [];
        this.pageWidth = 210;
        this.pageHeight = 297;
        this.margin = 20;
        this.contentWidth = 170; // pageWidth - (margin * 2)
    }

    async generatePDF(project, slides) {
        this.currentProject = project;
        this.slides = slides;
        
        try {
            // Check if jsPDF is available
            if (!window.jspdf) {
                throw new Error('jsPDF library not loaded. Please check your internet connection.');
            }

            const { jsPDF } = window.jspdf;
            this.pdf = new jsPDF('p', 'mm', 'a4');
            
            console.log('📄 Starting PDF generation...');
            
            // Generate PDF content
            this.addTitlePage();
            
            for (let i = 0; i < this.slides.length; i++) {
                if (i > 0) {
                    this.pdf.addPage();
                }
                this.addSlidePage(this.slides[i], i + 1);
            }
            
            this.addSummaryPage();
            
            console.log('✅ PDF generation complete');
            return this.pdf;
            
        } catch (error) {
            console.error('❌ PDF Generation Error:', error);
            throw error;
        }
    }

    addTitlePage() {
        const centerX = this.pageWidth / 2;
        let yPos = 60;
        
        // Main title
        this.pdf.setFontSize(24);
        this.pdf.setFont(undefined, 'bold');
        const title = this.getProjectTitle();
        this.pdf.text(title, centerX, yPos, { align: 'center' });
        
        yPos += 20;
        
        // Subtitle
        this.pdf.setFontSize(16);
        this.pdf.setFont(undefined, 'normal');
        this.pdf.text('Educational Video Script', centerX, yPos, { align: 'center' });
        
        yPos += 40;
        
        // Project information box
        this.drawInfoBox(yPos);
        
        yPos += 80;
        
        // Speakers section
        this.addSpeakersSection(yPos);
    }

    addSlidePage(slide, slideNumber) {
        let yPos = this.margin;
        
        // Header with slide number and speaker
        this.addSlideHeader(slide, slideNumber, yPos);
        yPos += 20;
        
        // Title
        yPos = this.addSlideTitle(slide, yPos);
        
        // Content sections
        yPos = this.addSlideContent(slide, yPos);
        
        // Narration
        yPos = this.addSlideNarration(slide, yPos);
        
        // Technical details
        yPos = this.addSlideTechnicalDetails(slide, yPos);
        
        // Visual information
        if (slide.visual && slide.visual.type) {
            yPos = this.addSlideVisualInfo(slide, yPos);
        }
        
        // Footer separator
        this.addSlideFooter(yPos);
    }

    addSummaryPage() {
        this.pdf.addPage();
        let yPos = this.margin;
        
        // Summary title
        this.pdf.setFontSize(18);
        this.pdf.setFont(undefined, 'bold');
        this.pdf.text('Script Summary & Statistics', this.pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 25;
        
        // Statistics
        yPos = this.addStatistics(yPos);
        
        yPos += 15;
        
        // Visual functions used
        yPos = this.addVisualFunctionsList(yPos);
        
        yPos += 15;
        
        // Speaker breakdown
        yPos = this.addSpeakerBreakdown(yPos);
        
        // Footer
        this.addPDFFooter();
    }

    // Helper methods
    getProjectTitle() {
        return this.currentProject?.title || 
               this.slides[0]?.title || 
               'Educational Script';
    }

    drawInfoBox(yPos) {
        const boxHeight = 60;
        
        // Draw border
        this.pdf.setLineWidth(0.5);
        this.pdf.rect(this.margin, yPos, this.contentWidth, boxHeight);
        
        // Fill with light background
        this.pdf.setFillColor(245, 245, 245);
        this.pdf.rect(this.margin, yPos, this.contentWidth, boxHeight, 'F');
        
        // Add content
        yPos += 15;
        this.pdf.setFontSize(12);
        this.pdf.setFont(undefined, 'normal');
        this.pdf.setTextColor(0, 0, 0);
        
        const projectInfo = [
            `Project ID: ${this.currentProject?.projectId?.substring(0, 8) || 'Unknown'}`,
            `Generated: ${new Date().toLocaleDateString()}`,
            `Total Slides: ${this.slides.length}`,
            `Estimated Duration: ${this.calculateTotalDuration()}s`
        ];
        
        projectInfo.forEach((info, index) => {
            const x = this.margin + 10 + (index % 2) * (this.contentWidth / 2);
            const y = yPos + Math.floor(index / 2) * 8;
            this.pdf.text(info, x, y);
        });
    }

    addSpeakersSection(yPos) {
        this.pdf.setFontSize(14);
        this.pdf.setFont(undefined, 'bold');
        this.pdf.text('Speakers', this.margin, yPos);
        
        yPos += 12;
        this.pdf.setFontSize(11);
        this.pdf.setFont(undefined, 'normal');
        
        if (this.currentProject?.speakers) {
            Object.entries(this.currentProject.speakers).forEach(([key, speaker]) => {
                this.pdf.text(
                    `• ${speaker.name || key} (Voice: ${speaker.voice || 'default'}, Gender: ${speaker.gender || 'unknown'})`, 
                    this.margin + 5, 
                    yPos
                );
                yPos += 7;
            });
        } else {
            this.pdf.text('• No speaker information available', this.margin + 5, yPos);
        }
    }

    addSlideHeader(slide, slideNumber, yPos) {
        // Slide number
        this.pdf.setFontSize(16);
        this.pdf.setFont(undefined, 'bold');
        this.pdf.setTextColor(26, 82, 118); // Blue color
        this.pdf.text(`Slide ${slideNumber}`, this.margin, yPos);
        
        // Speaker info
        const speakerName = this.currentProject?.speakers?.[slide.speaker]?.name || slide.speaker;
        this.pdf.setFontSize(10);
        this.pdf.setFont(undefined, 'normal');
        this.pdf.setTextColor(100, 100, 100);
        this.pdf.text(`Speaker: ${speakerName}`, this.pageWidth - this.margin, yPos, { align: 'right' });
        
        this.pdf.setTextColor(0, 0, 0); // Reset to black
    }

    addSlideTitle(slide, yPos) {
        this.pdf.setFontSize(14);
        this.pdf.setFont(undefined, 'bold');
        const titleLines = this.pdf.splitTextToSize(slide.title || 'Untitled', this.contentWidth);
        this.pdf.text(titleLines, this.margin, yPos);
        return yPos + titleLines.length * 7 + 10;
    }

    addSlideContent(slide, yPos) {
        this.pdf.setFontSize(11);
        
        if (slide.content) {
            this.pdf.setFont(undefined, 'bold');
            this.pdf.text('Content:', this.margin, yPos);
            yPos += 7;
            
            this.pdf.setFont(undefined, 'normal');
            const contentLines = this.pdf.splitTextToSize(slide.content, this.contentWidth - 10);
            this.pdf.text(contentLines, this.margin + 5, yPos);
            yPos += contentLines.length * 5 + 8;
        }
        
        if (slide.content2) {
            this.pdf.setFont(undefined, 'bold');
            this.pdf.text('Additional Content:', this.margin, yPos);
            yPos += 7;
            
            this.pdf.setFont(undefined, 'normal');
            const content2Lines = this.pdf.splitTextToSize(slide.content2, this.contentWidth - 10);
            this.pdf.text(content2Lines, this.margin + 5, yPos);
            yPos += content2Lines.length * 5 + 8;
        }
        
        return yPos;
    }

    addSlideNarration(slide, yPos) {
        if (slide.narration) {
            this.pdf.setFontSize(11);
            this.pdf.setFont(undefined, 'bold');
            this.pdf.text('Narration:', this.margin, yPos);
            yPos += 7;
            
            this.pdf.setFont(undefined, 'italic');
            this.pdf.setTextColor(60, 60, 60);
            const narrationLines = this.pdf.splitTextToSize(slide.narration, this.contentWidth - 10);
            this.pdf.text(narrationLines, this.margin + 5, yPos);
            yPos += narrationLines.length * 5 + 8;
            
            this.pdf.setTextColor(0, 0, 0); // Reset to black
            this.pdf.setFont(undefined, 'normal');
        }
        
        return yPos;
    }

    addSlideTechnicalDetails(slide, yPos) {
        yPos += 5;
        this.pdf.setFontSize(9);
        this.pdf.setFont(undefined, 'normal');
        this.pdf.setTextColor(100, 100, 100);
        
        const techDetails = [
            `Duration: ${slide.visualDuration || 'N/A'}s`,
            `Complex: ${slide.isComplex ? 'Yes' : 'No'}`,
            `Speaker: ${slide.speaker}`
        ].join(' | ');
        
        this.pdf.text(techDetails, this.margin, yPos);
        this.pdf.setTextColor(0, 0, 0); // Reset to black
        
        return yPos + 10;
    }

    addSlideVisualInfo(slide, yPos) {
        this.pdf.setFontSize(10);
        this.pdf.setFont(undefined, 'bold');
        this.pdf.setTextColor(231, 76, 60); // Red color for visual
        this.pdf.text('🎨 Visual Function:', this.margin, yPos);
        yPos += 7;
        
        this.pdf.setFont(undefined, 'normal');
        this.pdf.setTextColor(0, 0, 0);
        const visualInfo = `${slide.visual.type}(${slide.visual.params ? slide.visual.params.join(', ') : ''})`;
        const visualLines = this.pdf.splitTextToSize(visualInfo, this.contentWidth - 10);
        this.pdf.text(visualLines, this.margin + 5, yPos);
        
        return yPos + visualLines.length * 5 + 8;
    }

    addSlideFooter(yPos) {
        if (yPos < this.pageHeight - this.margin - 20) {
            this.pdf.setLineWidth(0.3);
            this.pdf.setDrawColor(200, 200, 200);
            this.pdf.line(this.margin, yPos + 5, this.pageWidth - this.margin, yPos + 5);
        }
    }

    addStatistics(yPos) {
        this.pdf.setFontSize(12);
        this.pdf.setFont(undefined, 'bold');
        this.pdf.text('📊 Project Statistics', this.margin, yPos);
        yPos += 12;
        
        this.pdf.setFontSize(10);
        this.pdf.setFont(undefined, 'normal');
        
        const stats = [
            `Total Slides: ${this.slides.length}`,
            `Total Speakers: ${Object.keys(this.currentProject?.speakers || {}).length}`,
            `Visual Functions Used: ${this.getUniqueVisualFunctions().length}`,
            `Estimated Total Duration: ${this.calculateTotalDuration()}s`,
            `Complex Slides: ${this.slides.filter(s => s.isComplex).length}`,
            `Average Slide Duration: ${(this.calculateTotalDuration() / this.slides.length).toFixed(1)}s`
        ];
        
        stats.forEach(stat => {
            this.pdf.text(`• ${stat}`, this.margin + 5, yPos);
            yPos += 6;
        });
        
        return yPos;
    }

    addVisualFunctionsList(yPos) {
        const visualFunctions = this.getUniqueVisualFunctions();
        
        if (visualFunctions.length > 0) {
            this.pdf.setFontSize(12);
            this.pdf.setFont(undefined, 'bold');
            this.pdf.text('🎨 Visual Functions Used', this.margin, yPos);
            yPos += 12;
            
            this.pdf.setFontSize(10);
            this.pdf.setFont(undefined, 'normal');
            
            visualFunctions.forEach(func => {
                this.pdf.text(`• ${func}`, this.margin + 5, yPos);
                yPos += 6;
            });
        }
        
        return yPos;
    }

    addSpeakerBreakdown(yPos) {
        this.pdf.setFontSize(12);
        this.pdf.setFont(undefined, 'bold');
        this.pdf.text('👥 Speaker Breakdown', this.margin, yPos);
        yPos += 12;
        
        this.pdf.setFontSize(10);
        this.pdf.setFont(undefined, 'normal');
        
        const speakerCounts = {};
        this.slides.forEach(slide => {
            speakerCounts[slide.speaker] = (speakerCounts[slide.speaker] || 0) + 1;
        });
        
        Object.entries(speakerCounts).forEach(([speaker, count]) => {
            const speakerName = this.currentProject?.speakers?.[speaker]?.name || speaker;
            const percentage = ((count / this.slides.length) * 100).toFixed(1);
            this.pdf.text(`• ${speakerName}: ${count} slides (${percentage}%)`, this.margin + 5, yPos);
            yPos += 6;
        });
        
        return yPos;
    }

    addPDFFooter() {
        const footerY = this.pageHeight - 20;
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(100, 100, 100);
        this.pdf.text(
            'Generated by Educational Video Generator', 
            this.pageWidth / 2, 
            footerY, 
            { align: 'center' }
        );
        this.pdf.text(
            `Export Date: ${new Date().toLocaleString()}`, 
            this.pageWidth / 2, 
            footerY + 5, 
            { align: 'center' }
        );
    }

    // Utility methods
    calculateTotalDuration() {
        return this.slides.reduce((sum, slide) => sum + (slide.visualDuration || 4), 0);
    }

    getUniqueVisualFunctions() {
        return [...new Set(this.slides.filter(s => s.visual?.type).map(s => s.visual.type))];
    }

    downloadPDF(filename) {
        if (this.pdf) {
            this.pdf.save(filename);
            console.log(`✅ PDF downloaded: ${filename}`);
        } else {
            throw new Error('PDF not generated yet');
        }
    }
}

// Export for global use
window.PDFExporter = PDFExporter;

// Utility function for direct use
window.generateProjectPDF = async function(project, slides, filename) {
    try {
        const exporter = new PDFExporter();
        const pdf = await exporter.generatePDF(project, slides);
        exporter.downloadPDF(filename);
        return true;
    } catch (error) {
        console.error('❌ PDF Generation Failed:', error);
        throw error;
    }
};