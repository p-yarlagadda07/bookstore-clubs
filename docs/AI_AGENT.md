\# Next Read Agent

\## 1. Purpose

The Next Read agent helps a club moderator find a suitable book based on the club's request, available stock, and reading capacity.

It searches for candidates, checks copy availability, compares reading length with club constraints, and returns a shortlist with a written explanation.

\## 2. The Three Tools

\### searchCatalog

Searches the catalog for books that match the request.

It returns candidate books and matching information such as title, author, themes, page count, and relevance.

\### checkStockAndLength

Checks the candidate books' page counts, estimated reading time, and available copies.

It helps determine whether there are enough copies for the club.

\### compareClubConstraints

Compares candidate books with the club's reading capacity.

It reports whether each book fits the reading plan, is a tight fit, or is too long, with an explanation.

\## 3. Live Progress

The agent streams progress events while it works.

\- `started`: a tool has started.

\- `succeeded`: a tool has completed successfully.

\- `failed`: a tool has failed.

These events let the browser show progress before the final response arrives.

\## 4. Shortlist and Explanation

The agent combines catalog matches, stock information, and club constraints to help the moderator compare possible books.

The final response includes recommendations and an explanation of the results.

The moderator remains responsible for choosing the book.

\## 5. Safety

\- The reading-agent endpoint requires authentication.

\- Club constraints are retrieved from the application.

\- Books from unapproved sources must not be recommended.

\- The agent has a 45-second time limit.

\- The agent does not reserve books or place holds.

\## 6. Demo Scenario

\### Club

Tuesday Mystery Circle has eight members and meets in 14 days.

\### Request

"Find a short mystery for our next club meeting."

\### Candidate comparison

\*\*The Lantern Keeper's Secret\*\*

\- 380 pages

\- Estimated reading time: 9.5 hours

\- Three copies in total

\- Not enough copies for all eight members

\*\*Murder at Platform Nine\*\*

\- 220 pages

\- Estimated reading time: 5.5 hours

\- Ten copies in total

\- Enough copies for all eight members

\### Expected demonstration

1\. Sign in using a development test moderator account.

2\. Open Tuesday Mystery Circle.

3\. Open the Next Read agent.

4\. Submit the short-mystery request.

5\. Observe the live progress events.

6\. Review the candidate books and availability.

7\. Review the final shortlist and explanation.

Record the actual recommendation and results shown in the browser before submitting this guide.
