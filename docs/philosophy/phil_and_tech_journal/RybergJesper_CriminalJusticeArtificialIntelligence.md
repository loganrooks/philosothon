Title: Criminal Justice and Artificial Intelligence: How Should we Assess the Performance of Sentencing Algorithms? | Philosophy & Technology
URL: https://link.springer.com/article/10.1007/s13347-024-00694-3
Content:

Abstract
--------

Artificial intelligence is increasingly permeating many types of high-stake societal decision-making such as the work at the criminal courts. Various types of algorithmic tools have already been introduced into sentencing. This article concerns the use of algorithms designed to deliver sentence recommendations. More precisely, it is considered how one should determine whether one type of sentencing algorithm (e.g., a model based on machine learning) would be ethically preferable to another type of sentencing algorithm (e.g., a model based on old-fashioned programming). Whether the implementation of sentencing algorithms is ethically desirable obviously depends upon various questions. For instance, some of the traditional issues that have received considerable attention are algorithmic biases and lack of transparency. However, the purpose of this article is to direct attention to a further challenge that has not yet been considered in the discussion of sentencing algorithms. That is, even if is assumed that the traditional challenges concerning biases, transparency, and cost-efficiency have all been solved or proven insubstantial, there will be a further serious challenge associated with the comparison of sentencing algorithms; namely, that we do not yet possess an ethically plausible and applicable criterion for assessing how well sentencing algorithms are performing.

### Similar content being viewed by others

### Explore related subjects

Discover the latest articles, news and stories from top researchers in related subjects.

Artificial intelligence is becoming omnipresent. Various types of algorithmic tools are increasingly – indeed at a significant pace – permeating all domains of social life (see Ryberg and Roberts [2022a](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR25 "Ryberg, J., & Roberts, J. V. (2022). Sentencing and Artificial Intelligence: Setting the Stage. In J. Ryberg & J. V. Roberts (Eds.), Sentencing and Artificial Intelligence (pp. 1–13). Oxford University Press.")). This is also the case in contexts that involve what is characterized as high-stake societal decision-making; that is, decision-making that has a significant impact on the life and well-being of citizens. An obvious example of such a context is the criminal justice system.

Algorithmic tools are currently infiltrating all stages of criminal justice practice, from the work of the police to the final verdicts in court. For instance, risk assessment algorithms – such as the much-debated COMPAS algorithm – have for a long time been used in the US to inform the courts of the likelihood that offenders will fall back into crime. A more radical example is the use of algorithms designed to provide sentence recommendations in individual criminal cases. For instance, systems that determine sentences in cases of serious crime – such as rape and drug possession – have already been put into practice.[Footnote 1] And some states have declared their intentions of introducing ‘intelligent courts’ based on the use of AI in judicial decision-making, including sentencing.[Footnote 2] Thus, even though this is currently still only an aspiration, it may become reality in a not very distant future. But if it is the case that algorithms designed to determine sentences are about to find their way into the sentencing process in court, then one of the many questions one will be confronted with is what type of algorithms should be used in relation to such important decisions as the determination of sentences? For instance, would the use of machine-learning-based systems be desirable? This question has not yet been the subject of more comprehensive discussions. However, a few commentators have cursorily addressed the issue.

For instance, one of the concerns that have been expressed against the use of more complicated systems, such as machine learning algorithms, is that the predictive accuracy of these systems comes at a price: namely, a lack of interpretability of the inner workings of the systems. As observed by computer scientist David Cunning and his colleagues: ‘There may be inherent conflict between ML \[machine learning\] performance (e.g. predictive accuracy) and explainability. Often, the highest performing methods (e.g. DL \[deep learning\]) are the least explainable, and the most explainable (e.g. decision trees) are the least accurate’ (Gunning et al., 2019). A possible way of dealing with a lack of explainability of more complicated machine learning systems has been to draw on explainable artificial intelligence (xAI); that is, a second algorithm which is created to explain post hoc the workings of the black box system. However, this combination has been the subject of criticism. One of the strongest critics is Cynthia Rudin, who has argued that rather than relying on a combination of opaque algorithmic systems and xAI, what one should do is to use algorithmic tools that are ‘inherently interpretable’; that is, systems that ‘provide their own explanations, which are faithful to what the model actually computes’ (Rudin, 2019). What she holds is that the current business model of machine learning often incentivizes firms to develop algorithms that are ‘overly complicated’ and that quite often ‘organizations do not have analysts who have the training or expertise to construct interpretable models at all’ (Rudin, 2019). On the grounds of the experience that she has ‘not yet found a high-stakes application where a fully black box model is necessary’, she ultimately suggests, as a general rule of thumb, that when it comes to high-stake societal applications, including the use of algorithmic tools in a criminal justice context, ‘no black box should be deployed when there exists an interpretable model with the same level of performance’ (Rudin, 2019). Thus, in her view machine-learning sentencing algorithms would often not be recommendable.[Footnote 3]

Another theorist who has briefly commented on the issue of what may constitute the desirable type of algorithm in a sentencing context is Frej Thomsen. In Thomsen’s view, there are several advantages of introducing algorithmic tools into sentencing. In fact, he even argues that when it comes to the determination of sentences, there are strong reasons in favour of implementing ‘fully automated decision-making’ (Thomsen, 2022). In this case, we would still be confronted with the question of what would constitute the preferable algorithm if such tools were to be implemented at sentencing. Suppose, for instance, that different computer scientists have either offered a highly complicated deep learning algorithm, a less complicated machine learning algorithm, or an algorithm not based on machine learning, and, further, that these algorithms all seem to be doing a fine job when it comes to the determination of sentences in individual criminal cases, then which system should be regarded as preferable?[Footnote 5]

When the question is phrased in this manner, that is, by initially excluding all the standard types of ethical challenge that are usually considered in comparisons between different algorithm systems, then it may seem that the answer becomes obvious: one should choose the algorithm that is best at doing the job it is designed to do; that is _in casu_ the one that excels when it comes to the determination of sentences in criminal cases. However, even though this answer may sound almost like a truism, what will be argued in the following is that the application of this answer is in fact highly complicated. The answer presupposes solutions to a set of penal theoretical challenges that have not yet been provided. The implication, therefore, is that we do not yet possess the theoretical background that allows us to make justified assessments of which type of algorithm would be preferable for sentencing purposes. At least, so it will be argued.[Footnote 6]

In order to sustain this conclusion, the article will proceed as follows. Section (1) considers a first possible candidate for a criterion for the assessment of the relative performance of sentencing algorithms. The criterion is based on indistinguishability between sentences determined by algorithms and human judges. It is argued that this criterion, despite immediate plausibility, should be dismissed. In Sect. (2), another criterion for the assessment of the performance of algorithmic tools is considered. This criterion is based on penal ethical considerations. It is argued that even though the criterion is indeed ethically plausible, it presupposes answers to a range of penal theoretical challenges that have not yet been provided. Section (3) considers a final possible assessment criterion based on considerations of overpunishment. It is argued that even though this criterion may provide some guidance, it is likely to be confronted with the same ethical challenge as the criterion considered in Sect. (2). Section (4) summarizes and concludes.

What the discussion will underline is the fact that the justified implementation of algorithmic tools – like any other type of technology – is contingent on ethical considerations and, therefore, if the relevant ethical theories have not yet been sufficiently developed, it may not be possible to determine whether such tools constitute an improvement.

1 The Indistinguishability Criterion
------------------------------------

Suppose that two different sentencing algorithms have been developed.[Footnote 7] For instance, these could be a system based on machine learning and one that does not involve machine learning. For reasons of ease in exposition, let us call the competing systems α and β. In the comparison between these systems, what does it mean to say α is performing better β (or vice versa)? A first possible criterion for the comparative assessment that might come to mind would be to hold that we should prefer the algorithm which comes closest to determining the sentences that would have been determined by human judges. That is to say, more precisely, that assessment should be based on:

> _The indistinguishability criterion_: α is preferable to β if and only if the sentences determined by α to a larger extent than those determined by β equal those that would have been determined by human judges.

This criterion has some immediate appeal. Particularly if we are considering the use of algorithms considered by Thomsen and others, which involves the replacement of human judges in favour of fully automated sentencing decisions, it seems plausible to suggest that the question of whether an algorithm will be able to do the job usually carried out by judges must constitute a proper yardstick for the assessment of an algorithm. Therefore, the comparison of the merits of competing algorithmic systems must also depend upon the system’s ability to mirror the decisions of human judges. Obviously, a criterion that makes indistinguishability from decisions by judges the parameter for the comparison of algorithmic merits needs some clarification in order to work in practice. For instance, judges do not always mete out the same sentences in similar cases. Many studies have established the existence of sentence disparity within the same jurisdictions.[Footnote 8] However, even if we disregard this sort of challenge, there is a more basic ethical reason to be sceptical with regard to an indistinguishability-based criterion for the comparative assessment of algorithm systems.

The main problem is that, on closer inspection, it is difficult to see why the sentences determined by human judges should constitute a plausible parameter for the assessment. The criterion implies that the best possible algorithmic system would be the one that achieves complete indistinguishability from sentences determined by judges. For instance, if human judges would give two years in prison for a burglary, four years for an assault, and six years for a rape, then the best we can hope for is that an algorithm would reach the very same sentences. However, in many other contexts in which algorithmic tools are implemented, the ambitions are much higher. For instance, when machine learning algorithms are used to analyse scan images in medical contexts, the idea is not only that these tools should perform in the same way as human radiologists. Rather, the goal is that they will be able to out-perform radiologists by producing assessments that are correct in cases where radiologists fail. The same is the case in many other contexts in which algorithmic instruments are currently taking over the work of humans. Algorithms are implemented not only to maintain levels of human decision-making, but also to improve them. Could there be room for the same ambition if we are considering the introduction of algorithms into sentencing?

The answer must be in the affirmative and it does not require much reflection to sustain this contention. For instance, there are strong reasons to believe that the decisions made by human judges may sometimes be biased. Many studies have established that black and brown people are treated more harshly in the US and in other countries (von Hirsch and Roberts, 1997). Moreover, there are many studies that have supported the conclusion that sentencing decisions may also be skewed in other ways than by racial biases.[Footnote 9] Therefore, suppose that we have a case in which a human judge would give eight months in prison for a certain crime, but that the unbiased sentence would have been six months. In this case, it is very hard to maintain the view that indistinguishability from human decisions should constitute the most plausible criterion for the assessment of algorithms.[Footnote 10] Rather, what we should ideally want from a sentencing algorithm is that it recommends a six-month prison term. In fact, the hope that algorithmic tools may help us to avoid some of the biases of human decision-making has been used as an argument in favour of replacing human judges with fully automated decision-making (see Thomsen, 2022). In other words, when it comes to sentencing algorithms, it also seems plausible to believe that there is room for out-performing human judgements. Human sentencing decisions cannot be assumed to always be ethically perfect (in fact, as we shall see shortly, there are several other reasons beyond those illustrated in the bias example underpinning this contention). Therefore, indistinguishability from human sentencing decisions cannot constitute a necessary condition for the comparative assessment of different types of sentencing algorithms.

2 The Penal Ethical Criterion
-----------------------------

If the previous considerations are true, that is, if it is correct that the sentences reached by human judges do not constitute a plausible parameter for the comparative assessment of different types of sentencing algorithms, then what does it mean to hold that one sentencing algorithm is performing better than another? On the basis of the previous considerations, there is a criterion for the comparative assessment that seems straightforward. Given the challenge that there may be some sentences that would be ethically preferable even if they deviate from those that would have been determined by human judges, an obvious possibility would be to base a criterion directly on what constitutes an ethical approach to the imposition of sentences on offenders. More precisely, what might be suggested is:

> _The penal ethical criterion_: α is preferable to β if and only if α to a larger extent than β succeeds in determining sentences that accord with our best ethical theory of punishment.

This criterion for comparison is clearly more plausible than the indistinguishability criterion. While the possibility of ethically preferable deviations from the sentences determined by judges showed that indistinguishability could not constitute a necessary condition for the assessment of algorithms, the penal ethical criterion is not vulnerable to the same objection. All that matters, according to this criterion, is what would be ethically desirable, not what sentences would have been determined by judges. It might perhaps therefore also be said that the criterion comes close to a truism: how could a sentencing algorithm fail to be preferable, if it determines sentences that are ethically better than those determined by another algorithm? However, even though this criterion is indeed hard to dispute as long as we have initially excluded all types of collateral consequences that might be part of an all-things-considered assessment of sentencing algorithms, this does not imply that it is devoid of challenges. The problem facing this criterion is that it is very hard to apply in practice. There are, as we shall now see, several reasons why this is the case.

The first problem is that it is far from clear what should be considered the best ethical theory of punishment. The story of how the ethics of punishment has developed has often been told. During much of the nineteenth and twentieth centuries, the utilitarian approach to punishment dominated the philosophical discussion. The retributivist approach was often regarded as an inhumane or even barbarous position far distant from what could possibly be seen as an enlightened approach to the issue. However, in the early 1970s the picture started to change. An increasing number of penal theorists declared their approval of retributivist thinking and references to the revival or renaissance of retributivism became part of the standard refrain in titles and opening lines of works on penal theory (Duff and Garland, 1994). Though I cannot here enter a thorough discussion of these theories, it is fair to hold that they have so far only provided the contours of very general frameworks for how questions of penal distribution should be approached.[Footnote 13] No theories have provided precise answers to how severely different crimes should be sentenced. Therefore, when it comes to the question of what constitutes the ethically right sentence for a particular crime, current consequentialist and retributivist theories have not yet provided answers which the penal theoretical criterion can draw on in the comparison of the merits of sentencing algorithms. The same is the case with regard to other penal theories in the field.

What these considerations show is of course not that it is impossible to apply the penal theoretical criterion in the assessment of sentencing algorithms. It could be the case that penal theory will in the future be developed in a way that suffices to provide answers to the detailed questions of penal distribution which the application of the criterion requires. However, it is fair to say that we are currently very far from possessing the theoretical (and empirical) resources which the application of the penal ethical criterion presupposes. Thus, even though the criterion is indeed plausible in principle, it is still of little use in actual cases that require the comparison of the merits of competing sentencing algorithms.

3 The Over-punishment Criterion
-------------------------------

Even though it is a fact that theories of punishment have so far had very little to offer with regard to the severity of the sentences that should be imposed on different offenders, it might perhaps still be felt that the previous considerations are somewhat premature. It may be a fact that current penal theory is unable to prescribe whether a thief should spend four or five months in prison, or whether a drunk driver should pay a fine of 500 or 600 dollars. However, this does not necessarily imply that penal theories are devoid of the possibility of giving any sort of direction with regard to what constitute the appropriate penal levels. In fact, there seems to be a remarkable agreement amongst penal theorists on the fact that many offenders, not only in the US but also in many other countries, are currently being punished much too severely.

One of the reasons that have been given in support of this view is that there is a problem of over-criminalization. That is, that there are simply too many ways of acting that should not have been criminalized in the first place. For instance, Douglas Husak, who has comprehensively considered the issue, characterizes over-criminalization as ‘the most pressing problem with the criminal law today’ (Husak, 2008).
    
3.  For a more comprehensive discussion of Rudin’s arguments and, more generally, of the conflict between accuracy and explainability, see also Ryberg and Petersen [2022](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR24 "Ryberg, J., & Petersen, T. S. (2022). Sentencing and the Conflict between Algorithmic Accuracy and Transparency. In J. Ryberg & J. V. Roberts (Eds.), Sentencing and Artificial Intelligence (pp. 57–73). Oxford University Press.").
    
4.  For instance, another obvious question will be whether one algorithmic system is more cost-effective than another in the sense of reducing case-processing time and resources spent in the courts (Hunter et al., 2020). Yet another question concerns challenges with the regard to the collection of data on which algorithms should trained (see e.g., Schwarze and Roberts [2022](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR29 "Schwarze, M., & Roberts, J. V. (2022). Reconciling Artificial and Human Intelligence: Supplementing Not Supplanting the Sentencing Judge. In J. Ryberg & J. V. Roberts (Eds.), Sentencing and Artificial Intelligence (pp. 206–229). Oxford University Press.")).
    
5.  The reason for assuming that the competing algorithms are doing “a fine job” is of course this is what generates the challenge of comparing the performance of the algorithms. If a sentencing algorithm would recommend a life sentence in all cases of theft, then it would be an easy job to dismiss it as a tool in the sentencing process.
    
6.  As noted, this article will only discuss algorithms designed to provide sentence recommendations (e.g., that a particular offender should have 6 months in prison), not algorithms designed to produce risk assessments. If it possible to show that an ethical assessment of risk assessments is contingent on the question of what constitute the ethically right sentences of offenders, then it might the case that the ensuing considerations would also be relevant for the discussion of the comparative performance of risk assessment algorithms. For arguments in support of this contention, see e.g. Ryberg [2020a](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR19 "Ryberg, J. (2020a). Risk Assessment and Algorithmic Accuracy. Ethical Theory and Moral Practice, 23, 251–263.") and Ryberg and Thomsen [2022](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR33 "Thomsen, F. K. (2022). Iudicium ex Machinae: The Ethical Challenges of Automated Decision-making at Sentencing. In J. Ryberg & J. V. Roberts (Eds.), Sentencing and Artificial Intelligence (pp. 254–278). Oxford University Press."). However, within the scope of the present article, there will not be space to consider such an extrapolation of the arguments.
    
7.  The discussion of the criteria in this and the following sections draws on thoughts that have been presented in relation to a discussion of when algorithms are performing better than humans, and of when it would be justified to replace human judges with algorithms in sentencing, see Ryberg [2024a](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR26 "Ryberg, J. (2024a). Punishment and Artificial Intelligence. In J. Ryberg (Ed.), The Oxford Handbook of the Philosophy of Punishment. Oxford University Press, (forthcoming).").
    
8.  For a brief overview of some of the studies that have been conducted on disparity in sentencing in the US and in Europe, see e.g. Ryberg [2023](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR23 "Ryberg, J. (2023). Sentencing Disparity and Artificial Intelligence. The Journal of Value Inquiry, 57, 447–462.").
    
9.  For instance, studies have been conducted on how legal decisions may be affected by anchor effects (Englich et al., 2006), hindsight biases (Harley [2007](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR8 "Harley, E. M. (2007). Hindsight Bias in Legal Decision Making. Social Cognition, 25, 48–63.")), and perspective effects (Lassiter et al., 2009).
    
10.  For a parallel discussion concerning replacement of human judges with algorithms, see Ryberg [2024a](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR26 "Ryberg, J. (2024a). Punishment and Artificial Intelligence. In J. Ryberg (Ed.), The Oxford Handbook of the Philosophy of Punishment. Oxford University Press, (forthcoming).").
    
11.  For an overview and discussion of many of these theories, see e.g. Ryberg [2024b](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR27 "Ryberg, J. (2024b). The Oxford Handbook of the Philosophy of Punishment. Oxford University Press, (forthcoming).").
    
12.  See, for instance, von Hirsch [1993](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR37 "von Hirsch, A. (1993). Censure and Sanctions. Clarendon Press."); von Hirsch and Ashworth [2005](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR39 "Von Hirsch, A., & Ashworth, A. (2005). Proportionate Sentencing. Oxford University Press."); Ryberg [2004](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR17 "Ryberg, J. (2004). The Ethics of Proportionate Punishment: A Critical Investigation. Kluwer Academic Publishers."); Tonry [2020](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR35 "Tonry, M. (Ed.). (2020). Of One-Eyed and Toothless Miscreants. Oxford University Press.").
    
13.  Furthermore, it should be mentioned that the few theories that have attempted to provide a theoretical framework for providing answers to how severely different crimes should be punished, have been subject of massive criticism. See, for instance, Ryberg [2004](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR17 "Ryberg, J. (2004). The Ethics of Proportionate Punishment: A Critical Investigation. Kluwer Academic Publishers.") and [2020b](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR20 "Ryberg, J. (2020b). Proportionality and the Seriousness of Crimes. In M. Tonry (Ed.), Of One-Eyed and Toothless Miscreants (pp. 51–75). Oxford University Press."); Tonry [2020](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR35 "Tonry, M. (Ed.). (2020). Of One-Eyed and Toothless Miscreants. Oxford University Press.").
    
14.  In order to deal with this question, one would have to engage in considerations of how one should, from a retributivist perspective, compare sets of sentences with differing patterns of deviations from the ethically right sentences. To take a very simple example: suppose that α recommends that offender A gets 3 months, that offender B gets 6 months, and that offenders C gets 8 months, while β recommends that A gets 4 months, that B gets 3 months, and that C gets 9 months. Suppose further that all these sentences would constitute instances of over-punishment. In that case, which of the two algorithms would be ethically preferable? To my knowledge, modern retributivists have not yet provided any sort of guidance on how such comparisons should be made (see also Ryberg [2014](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR18 "Ryberg, J. (2014). When Should Neuroimaging be Applied in the Criminal Court? The Journal of Ethics, 18, 81–99.")).
    
15.  The problem is captured in what I have elsewhere called _the dilemma of AI-based sentencing_: namely, that a machine-learning sentencing algorithm may work on the basis either of a dataset that is built on actual sentencing decisions of the judiciary within a jurisdiction – in this case, the system may be practically workable but it is not clear that this would result in an ethical improvement of sentencing practice – or of a database built on hypothetical assessments of what would have constituted the ethically right sentences in various cases. In the latter case, the system would in principle provide an ethically proper guideline but would hardly be politically workable under real-life circumstances where there is a significant gap between penal theory and penal practice (see Ryberg [2023](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR23 "Ryberg, J. (2023). Sentencing Disparity and Artificial Intelligence. The Journal of Value Inquiry, 57, 447–462.")).
    
16.  It might perhaps be suggested that historical sentences are ethically important because it is crucial to maintain consistency in the form of ordinal proportionality over time. However, as suggested, if it is the case that offenders are currently being over-punished, then this argument presupposes that ordinal proportionality has primacy over considerations of what constitute the right penal levels non-relatively speaking. As argued elsewhere, this is hardly a plausible position. For instance, it is not plausible to go on over-punishing offenders simply because previous offenders have been over-punished (see Ryberg [2023](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR23 "Ryberg, J. (2023). Sentencing Disparity and Artificial Intelligence. The Journal of Value Inquiry, 57, 447–462."); and Duus-Ötterstroöm [2020](https://link.springer.com/article/10.1007/s13347-024-00694-3#ref-CR5 "Duus-Ötterström, G. (2020). Weighing Relative and Absolute Proportionality in Punishment. In M. Tonry (Ed.), Of One-Eyed and Toothless Miscreants (pp. 30–50). Oxford University Press.")).
    

References
----------

*   Chiao, V. (2018). Predicting Proportionality: The Case for Algorithmic Sentencing. _Criminal Justice Ethics,_ _37_, 238–261.
    
    [Article](https://doi.org/10.1080%2F0731129X.2018.1552359)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Predicting%20Proportionality%3A%20The%20Case%20for%20Algorithmic%20Sentencing&journal=Criminal%20Justice%20Ethics&doi=10.1080%2F0731129X.2018.1552359&volume=37&pages=238-261&publication_year=2018&author=Chiao%2CV) 
    
*   Clair, M., & Winter, A. S. (2017). How Judges Can Reduce Racial Disparities in the Criminal-Justice System. _Court Review: The Journal of the American Judges Association,_ _598_, 158–160.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=How%20Judges%20Can%20Reduce%20Racial%20Disparities%20in%20the%20Criminal-Justice%20System&journal=Court%20Review%3A%20The%20Journal%20of%20the%20American%20Judges%20Association&volume=598&pages=158-160&publication_year=2017&author=Clair%2CM&author=Winter%2CAS) 
    
*   Davies, B., & Douglas, T. (2022). Learning to discriminate: The perfect proxy problem in artificially intelligent sentencing. In J. Ryberg & J. V. Roberts (Eds.), _Sentencing and Artificial Intelligence_ (pp. 97–120). Oxford University Press.
    
    [Chapter](https://doi.org/10.1093%2Foso%2F9780197539538.003.0006)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Learning%20to%20discriminate%3A%20The%20perfect%20proxy%20problem%20in%20artificially%20intelligent%20sentencing&doi=10.1093%2Foso%2F9780197539538.003.0006&pages=97-120&publication_year=2022&author=Davies%2CB&author=Douglas%2CT) 
    
*   Duff, A., & Garland, G. (Eds.). (1994). _A Reader on Punishment_. Oxford University Press.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=A%20Reader%20on%20Punishment&publication_year=1994) 
    
*   Duus-Ötterström, G. (2020). Weighing Relative and Absolute Proportionality in Punishment. In M. Tonry (Ed.), _Of One-Eyed and Toothless Miscreants_ (pp. 30–50). Oxford University Press.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Weighing%20Relative%20and%20Absolute%20Proportionality%20in%20Punishment&pages=30-50&publication_year=2020&author=Duus-%C3%96tterstr%C3%B6m%2CG) 
    
*   Englich, B., et al. (2006). Playing Dice with Criminal Sentences. _Personality and Social Psychology Bulletin,_ _32_, 188–200.
    
    [Article](https://doi.org/10.1177%2F0146167205282152)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Playing%20Dice%20with%20Criminal%20Sentences&journal=Personality%20and%20Social%20Psychology%20Bulletin&doi=10.1177%2F0146167205282152&volume=32&pages=188-200&publication_year=2006&author=Englich%2CB) 
    
*   Gunning, D., et al. (2019). XAI - Explainable artificial intelligence. _Science Robotics,_ _4_, 1–2.
    
    [Article](https://doi.org/10.1126%2Fscirobotics.aay7120)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=XAI%20-%20Explainable%20artificial%20intelligence&journal=Science%20Robotics&doi=10.1126%2Fscirobotics.aay7120&volume=4&pages=1-2&publication_year=2019&author=Gunning%2CD) 
    
*   Harley, E. M. (2007). Hindsight Bias in Legal Decision Making. _Social Cognition,_ _25_, 48–63.
    
    [Article](https://doi.org/10.1521%2Fsoco.2007.25.1.48)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Hindsight%20Bias%20in%20Legal%20Decision%20Making&journal=Social%20Cognition&doi=10.1521%2Fsoco.2007.25.1.48&volume=25&pages=48-63&publication_year=2007&author=Harley%2CEM) 
    
*   Hunter, D., et al. (2020). A Framework for the Efficient and Ethical Use of Artificial Intelligence in the Criminal Justice System. _Florida University State Law Review,_ _47_, 749–800.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=A%20Framework%20for%20the%20Efficient%20and%20Ethical%20Use%20of%20Artificial%20Intelligence%20in%20the%20Criminal%20Justice%20System&journal=Florida%20University%20State%20Law%20Review&volume=47&pages=749-800&publication_year=2020&author=Hunter%2CD) 
    
*   Husak, D. (2008). _Overcriminalization: The Limits of the Criminal Law_. Oxford University Press.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Overcriminalization%3A%20The%20Limits%20of%20the%20Criminal%20Law&publication_year=2008&author=Husak%2CD) 
    
*   Khazanah Research Institute. (2021). _#NetworkedNation: Navigating Challenges, Realising Oppurtunities of Digital Transformation_. Kula Lumpur: Khazanah Research Institute.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=%23NetworkedNation%3A%20Navigating%20Challenges%2C%20Realising%20Oppurtunities%20of%20Digital%20Transformation&publication_year=2021) 
    
*   Lassiter, G. D., et al. (2009). Evidence of the Camera Perspective Bias in Authentic Videotaped Interrogations: Implications for Emerging Reform in the Criminal Justice System. _Legal and Criminological Psychology,_ _14_, 157–170.
    
    [Article](https://doi.org/10.1348%2F135532508X284293)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Evidence%20of%20the%20Camera%20Perspective%20Bias%20in%20Authentic%20Videotaped%20Interrogations%3A%20Implications%20for%20Emerging%20Reform%20in%20the%20Criminal%20Justice%20System&journal=Legal%20and%20Criminological%20Psychology&doi=10.1348%2F135532508X284293&volume=14&pages=157-170&publication_year=2009&author=Lassiter%2CGD) 
    
*   Lippert-Rasmussen, K. (2022). Algorithmic-based sentencing and discrimination. In J. Ryberg & J. V. Roberts (Eds.), _Sentencing and Artificial Intelligence_ (pp. 74–96). Oxford University Press.
    
    [Chapter](https://doi.org/10.1093%2Foso%2F9780197539538.003.0005)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Algorithmic-based%20sentencing%20and%20discrimination&doi=10.1093%2Foso%2F9780197539538.003.0005&pages=74-96&publication_year=2022&author=Lippert-Rasmussen%2CK) 
    
*   Lippke, R. (2012). Anchoring the Sentencing Scale: A Modest Proposal. _Theoretical Criminology,_ _16_, 463–480.
    
    [Article](https://doi.org/10.1177%2F1362480612449778)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Anchoring%20the%20Sentencing%20Scale%3A%20A%20Modest%20Proposal&journal=Theoretical%20Criminology&doi=10.1177%2F1362480612449778&volume=16&pages=463-480&publication_year=2012&author=Lippke%2CR) 
    
*   Murphy, J. G. (1979). _Retribution, Justice, and Therapy_. Kluwer Academic Publishers.
    
    [Book](https://link.springer.com/doi/10.1007/978-94-009-9461-4)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Retribution%2C%20Justice%2C%20and%20Therapy&doi=10.1007%2F978-94-009-9461-4&publication_year=1979&author=Murphy%2CJG) 
    
*   Rudin, C. (2019). Stop Explaining Black Box Machine Learning for High Stakes Decisions and Use Interpretable Models Instead. _Nature Machine Intelligence,_ _1_, 296–215.
    
    [Article](https://doi.org/10.1038%2Fs42256-019-0048-x)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Stop%20Explaining%20Black%20Box%20Machine%20Learning%20for%20High%20Stakes%20Decisions%20and%20Use%20Interpretable%20Models%20Instead&journal=Nature%20Machine%20Intelligence&doi=10.1038%2Fs42256-019-0048-x&volume=1&pages=296-215&publication_year=2019&author=Rudin%2CC) 
    
*   Ryberg, J. (2004). _The Ethics of Proportionate Punishment: A Critical Investigation_. Kluwer Academic Publishers.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=The%20Ethics%20of%20Proportionate%20Punishment%3A%20A%20Critical%20Investigation&publication_year=2004&author=Ryberg%2CJ) 
    
*   Ryberg, J. (2014). When Should Neuroimaging be Applied in the Criminal Court? _The Journal of Ethics,_ _18_, 81–99.
    
    [Article](https://link.springer.com/doi/10.1007/s10892-014-9166-1)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=When%20Should%20Neuroimaging%20be%20Applied%20in%20the%20Criminal%20Court%3F&journal=The%20Journal%20of%20Ethics&doi=10.1007%2Fs10892-014-9166-1&volume=18&pages=81-99&publication_year=2014&author=Ryberg%2CJ) 
    
*   Ryberg, J. (2020a). Risk Assessment and Algorithmic Accuracy. _Ethical Theory and Moral Practice,_ _23_, 251–263.
    
    [Article](https://link.springer.com/doi/10.1007/s10677-020-10066-3)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Risk%20Assessment%20and%20Algorithmic%20Accuracy&journal=Ethical%20Theory%20and%20Moral%20Practice&doi=10.1007%2Fs10677-020-10066-3&volume=23&pages=251-263&publication_year=2020&author=Ryberg%2CJ) 
    
*   Ryberg, J. (2020b). Proportionality and the Seriousness of Crimes. In M. Tonry (Ed.), _Of One-Eyed and Toothless Miscreants_ (pp. 51–75). Oxford University Press.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Proportionality%20and%20the%20Seriousness%20of%20Crimes&pages=51-75&publication_year=2020&author=Ryberg%2CJ) 
    
*   Ryberg, J. (2022). Sentencing and Algorithmic Transparency. In J. Ryberg & J. V. Roberts (Eds.), _Sentencing and Artificial Intelligence_ (pp. 13–33). Oxford University Press.
    
    [Chapter](https://doi.org/10.1093%2Foso%2F9780197539538.003.0002)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Sentencing%20and%20Algorithmic%20Transparency&doi=10.1093%2Foso%2F9780197539538.003.0002&pages=13-33&publication_year=2022&author=Ryberg%2CJ) 
    
*   Ryberg, J., & Roberts, J. V. (Eds.). (2022). _Sentencing and Artificial Intelligence_. Oxford University Press.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Sentencing%20and%20Artificial%20Intelligence&publication_year=2022) 
    
*   Ryberg, J. (2023). Sentencing Disparity and Artificial Intelligence. _The Journal of Value Inquiry,_ _57_, 447–462.
    
    [Article](https://link.springer.com/doi/10.1007/s10790-021-09835-9)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Sentencing%20Disparity%20and%20Artificial%20Intelligence&journal=The%20Journal%20of%20Value%20Inquiry&doi=10.1007%2Fs10790-021-09835-9&volume=57&pages=447-462&publication_year=2023&author=Ryberg%2CJ) 
    
*   Ryberg, J., & Petersen, T. S. (2022). Sentencing and the Conflict between Algorithmic Accuracy and Transparency. In J. Ryberg & J. V. Roberts (Eds.), _Sentencing and Artificial Intelligence_ (pp. 57–73). Oxford University Press.
    
    [Chapter](https://doi.org/10.1093%2Foso%2F9780197539538.003.0004)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Sentencing%20and%20the%20Conflict%20between%20Algorithmic%20Accuracy%20and%20Transparency&doi=10.1093%2Foso%2F9780197539538.003.0004&pages=57-73&publication_year=2022&author=Ryberg%2CJ&author=Petersen%2CTS) 
    
*   Ryberg, J., & Roberts, J. V. (2022). Sentencing and Artificial Intelligence: Setting the Stage. In J. Ryberg & J. V. Roberts (Eds.), _Sentencing and Artificial Intelligence_ (pp. 1–13). Oxford University Press.
    
    [Chapter](https://doi.org/10.1093%2Foso%2F9780197539538.001.0001)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Sentencing%20and%20Artificial%20Intelligence%3A%20Setting%20the%20Stage&doi=10.1093%2Foso%2F9780197539538.001.0001&pages=1-13&publication_year=2022&author=Ryberg%2CJ&author=Roberts%2CJV) 
    
*   Ryberg, J. (2024a). Punishment and Artificial Intelligence. In J. Ryberg (Ed.), _The Oxford Handbook of the Philosophy of Punishment_. Oxford University Press, (forthcoming).
    
*   Ryberg, J. (2024b). _The Oxford Handbook of the Philosophy of Punishment_. Oxford University Press, (forthcoming).
    
*   Scheid, D. E. (1997). Constructing a Theory of Punishment, Desert, and the Distribution of Punishments. _The Canadian Journal of Law and Jurisprudence,_ _10_, 441–506.
    
    [Article](https://doi.org/10.1017%2FS0841820900001594)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Constructing%20a%20Theory%20of%20Punishment%2C%20Desert%2C%20and%20the%20Distribution%20of%20Punishments&journal=The%20Canadian%20Journal%20of%20Law%20and%20Jurisprudence&doi=10.1017%2FS0841820900001594&volume=10&pages=441-506&publication_year=1997&author=Scheid%2CDE) 
    
*   Schwarze, M., & Roberts, J. V. (2022). Reconciling Artificial and Human Intelligence: Supplementing Not Supplanting the Sentencing Judge. In J. Ryberg & J. V. Roberts (Eds.), _Sentencing and Artificial Intelligence_ (pp. 206–229). Oxford University Press.
    
    [Chapter](https://doi.org/10.1093%2Foso%2F9780197539538.003.0011)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Reconciling%20Artificial%20and%20Human%20Intelligence%3A%20Supplementing%20Not%20Supplanting%20the%20Sentencing%20Judge&doi=10.1093%2Foso%2F9780197539538.003.0011&pages=206-229&publication_year=2022&author=Schwarze%2CM&author=Roberts%2CJV) 
    
*   Shi, J. (2022). Artificial intelligence, algorithms and sentencing in Chinese Criminal Justice: Problems and Solutions. _Criminal Law Forum,_ _33_, 121–148.
    
    [Article](https://link.springer.com/doi/10.1007/s10609-022-09437-5)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Artificial%20intelligence%2C%20algorithms%20and%20sentencing%20in%20Chinese%20Criminal%20Justice%3A%20Problems%20and%20Solutions&journal=Criminal%20Law%20Forum&doi=10.1007%2Fs10609-022-09437-5&volume=33&pages=121-148&publication_year=2022&author=Shi%2CJ) 
    
*   Singer, R. G. (1979). _Just Deserts_. Ballenger Publishing Company.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Just%20Deserts&publication_year=1979&author=Singer%2CRG) 
    
*   Smilansky, S. (2021). Overpunishment and the Punishment of the Innocent. _Analytic Philosophy,_ _63_, 232–244.
    
    [Article](https://doi.org/10.1111%2Fphib.12235)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Overpunishment%20and%20the%20Punishment%20of%20the%20Innocent&journal=Analytic%20Philosophy&doi=10.1111%2Fphib.12235&volume=63&pages=232-244&publication_year=2021&author=Smilansky%2CS) 
    
*   Thomsen, F. K. (2022). Iudicium ex Machinae: The Ethical Challenges of Automated Decision-making at Sentencing. In J. Ryberg & J. V. Roberts (Eds.), _Sentencing and Artificial Intelligence_ (pp. 254–278). Oxford University Press.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Iudicium%20ex%20Machinae%3A%20The%20Ethical%20Challenges%20of%20Automated%20Decision-making%20at%20Sentencing&pages=254-278&publication_year=2022&author=Thomsen%2CFK) 
    
*   Tonry, M. (2016). Making American Sentencing Just, Humane, and Effective. _Crime and Justice,_ _46_(1), 441–504.
    
    [Article](https://doi.org/10.1086%2F688456)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Making%20American%20Sentencing%20Just%2C%20Humane%2C%20and%20Effective&journal=Crime%20and%20Justice&doi=10.1086%2F688456&volume=46&issue=1&pages=441-504&publication_year=2016&author=Tonry%2CM) 
    
*   Tonry, M. (Ed.). (2020). _Of One-Eyed and Toothless Miscreants_. Oxford University Press.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Of%20One-Eyed%20and%20Toothless%20Miscreants&publication_year=2020) 
    
*   Veiga, A., et al. (2023) Racial and ethnic disparities in sentencing: What Do we Know, and Where Should We Go?, _The Howard_ Journal _of Crime and Justice_, 2, 167-182.
    
*   von Hirsch, A. (1993). _Censure and Sanctions_. Clarendon Press.
    
    [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Censure%20and%20Sanctions&publication_year=1993&author=Hirsch%2CA) 
    
*   von Hirsch, A., & Roberts, J. V. (1997). Racial Disparity in Sentencing: Reflections on the Hood Study. _The Howard Journal,_ _36_, 227–236.
    
    [Article](https://doi.org/10.1111%2F1468-2311.00053)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Racial%20Disparity%20in%20Sentencing%3A%20Reflections%20on%20the%20Hood%20Study&journal=The%20Howard%20Journal&doi=10.1111%2F1468-2311.00053&volume=36&pages=227-236&publication_year=1997&author=Hirsch%2CA&author=Roberts%2CJV) 
    
*   Von Hirsch, A., & Ashworth, A. (2005). _Proportionate Sentencing_. Oxford University Press.
    
    [Book](https://doi.org/10.1093%2Facprof%3Aoso%2F9780199272600.001.0001)  [Google Scholar](http://scholar.google.com/scholar_lookup?&title=Proportionate%20Sentencing&doi=10.1093%2Facprof%3Aoso%2F9780199272600.001.0001&publication_year=2005&author=Hirsch%2CA&author=Ashworth%2CA) 
    

[Download references](https://citation-needed.springer.com/v2/references/10.1007/s13347-024-00694-3?format=refman&flavour=references)


Author information
------------------

### Authors and Affiliations

1.  Professor of Ethics and Philosophy of Law, Roskilde University, 4000, Roskilde, Denmark
    
    Jesper Ryberg
    