"""
Resume parsing service for extracting text from PDF and DOCX files.
"""

import os
import logging
from typing import Optional

import pdfplumber
import mammoth

# Configure logging
logger = logging.getLogger(__name__)


def extract_text_from_pdf(filepath: str) -> str:
    """
    Extract text from a PDF file using pdfplumber.
    
    Args:
        filepath: Path to the PDF file
        
    Returns:
        Extracted text as a single string
        
    Raises:
        Exception: If PDF parsing fails
    """
    try:
        text_content = []
        
        with pdfplumber.open(filepath) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                try:
                    page_text = page.extract_text()
                    if page_text:  # Only add non-empty pages
                        text_content.append(page_text)
                except Exception as page_error:
                    logger.warning(f"Failed to extract text from page {page_num}: {str(page_error)}")
                    continue
        
        # Combine all pages with double newlines for separation
        combined_text = "\n\n".join(text_content)
        
        if not combined_text.strip():
            raise Exception("No text content found in PDF")
        
        return combined_text.strip()
    
    except Exception as e:
        logger.error(f"PDF extraction failed for {filepath}: {str(e)}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")


def extract_text_from_docx(filepath: str) -> str:
    """
    Extract text from a DOCX file using mammoth.
    
    Args:
        filepath: Path to the DOCX file
        
    Returns:
        Extracted plain text (no HTML)
        
    Raises:
        Exception: If DOCX parsing fails
    """
    try:
        with open(filepath, "rb") as docx_file:
            result = mammoth.extract_raw_text(docx_file)
            text = result.value
        
        if not text.strip():
            raise Exception("No text content found in DOCX")
        
        return text.strip()
    
    except Exception as e:
        logger.error(f"DOCX extraction failed for {filepath}: {str(e)}")
        raise Exception(f"Failed to extract text from DOCX: {str(e)}")


def extract_text(filepath: str) -> str:
    """
    Extract text from a resume file based on its extension.
    
    Supports:
    - PDF (.pdf)
    - Microsoft Word (.docx)
    
    Args:
        filepath: Path to the resume file
        
    Returns:
        Extracted text as a string
        
    Raises:
        ValueError: If file format is not supported
        Exception: If extraction fails
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")
    
    # Get file extension
    _, ext = os.path.splitext(filepath)
    ext = ext.lower()
    
    # Route to appropriate extractor
    if ext == ".pdf":
        return extract_text_from_pdf(filepath)
    elif ext == ".docx":
        return extract_text_from_docx(filepath)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Only .pdf and .docx are supported.")
